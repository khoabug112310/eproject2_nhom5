// Socket.io Server logic for real-time chat & Gemini AI fallback
const { Server } = require('socket.io');
const https = require('https');
const env = require('./config/env');
const { ChatMessage, Doctor, Department } = require('./models');

let io = null;
const onlineStaff = new Set(); // Set of socket IDs of connected staff members

const callGemini = (prompt, key) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`Gemini API returned status code ${res.statusCode}: ${body}`));
          }
          const json = JSON.parse(body);
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts[0]) {
            resolve(json.candidates[0].content.parts[0].text);
          } else {
            reject(new Error(json.error?.message || 'Could not parse the response from the Gemini API'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
};

const getClinicContext = async () => {
  try {
    const [docs, depts] = await Promise.all([
      Doctor.find({ isActive: true }).populate('departmentId').lean(),
      Department.find().lean()
    ]);

    const doctorString = docs.map(d => 
      `- Dr. ${d.fullName} (Specialty: ${d.specialization}, Department: ${d.departmentId?.departmentName || 'General'}, Qualifications: ${d.qualifications || 'Specialist'}, Experience: ${d.experienceYears || 0} years)`
    ).join('\n');

    const departmentString = depts.map(dep => 
      `- ${dep.departmentName || dep.name}: ${dep.description || 'Medical consultations'}`
    ).join('\n');

    return `You are Hopsontai Assistant, the official AI customer support for Hopsontai General & Traditional Medicine Clinic.
Below is the clinic's real-time database context to help you answer patient queries accurately.

[CLINIC INFO]
- Clinic Name: Hopsontai General & Traditional Medicine Clinic
- Address: 123 Nguyen Trai Street, District 5, Ho Chi Minh City, Vietnam
- Hotline (Booking & Emergency): 091-444-4444
- Support Email: contact@hopsontai.vn
- Working Hours: Monday to Sunday: 7:00 AM – 8:00 PM (including public holidays)

[DEPARTMENTS]
${departmentString}

[DOCTORS]
${doctorString}

[GUIDELINES]
1. Answer patient questions in a helpful, concise, and professional tone.
2. Rely ONLY on the database context provided above. Do not make up doctor names, fees, or departments not listed.
3. If they want to book an appointment, instruct them to click the "Book Appointment" button or select "Book Now" from the home page.
4. Speak in English (since the client interface is set to English). Keep answers under 4 sentences if possible.`;
  } catch (err) {
    console.error('getClinicContext error:', err);
    return 'You are the AI assistant for Hopsontai Clinic. Speak in English, be concise and professional.';
  }
};

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.NODE_ENV === 'development' ? true : env.FRONTEND_URL,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // console.log(`Socket connected: ${socket.id}`);

    // Join room for users/patients
    socket.on('join_room', ({ userId, sessionId }) => {
      const roomName = userId ? `room_user_${userId}` : `room_guest_${sessionId}`;
      socket.join(roomName);
      socket.userRoom = roomName;
      socket.userId = userId || null;
      socket.sessionId = sessionId || null;
      // Send current staff online status to the client
      socket.emit('staff_status', { online: onlineStaff.size > 0 });
    });

    // Join room for staff members
    socket.on('join_staff', () => {
      socket.join('room_staff');
      socket.isStaff = true;
      onlineStaff.add(socket.id);
      // Broadcast online status to all users
      io.emit('staff_status', { online: true });
    });

    // Check staff status manually
    socket.on('check_staff_status', () => {
      socket.emit('staff_status', { online: onlineStaff.size > 0 });
    });

    // Handle user/guest message
    socket.on('send_message', async ({ text, userId, sessionId, senderName }) => {
      if (!text || !text.trim()) return;

      const roomName = userId ? `room_user_${userId}` : `room_guest_${sessionId}`;
      
      // 1. Create and save user message to database
      const userMsg = await ChatMessage.create({
        senderId: userId || null,
        senderName: senderName || 'Guest',
        senderType: userId ? 'patient' : 'guest',
        guestSessionId: sessionId || null,
        messageText: text.trim()
      });

      // Emit to user's room to update UI
      io.to(roomName).emit('new_message', userMsg);

      // 2. Route message
      if (onlineStaff.size > 0) {
        // If staff are online, send message to the staff room
        io.to('room_staff').emit('new_message', userMsg);
      } else {
        // If staff are offline, fallback to Gemini AI Assistant
        try {
          const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
          if (!apiKey) {
            // Fallback response if API key is missing
            const fallbackMsg = await ChatMessage.create({
              senderName: 'Hopsontai Assistant (AI)',
              senderType: 'ai',
              guestSessionId: sessionId || null,
              receiverId: userId || null,
              messageText: 'Currently, no support staff is online. Please submit a Quick Booking request or call our hotline at 091-444-4444.'
            });
            setTimeout(() => {
              io.to(roomName).emit('new_message', fallbackMsg);
            }, 600);
            return;
          }

          // Build context prompt
          const clinicContext = await getClinicContext();
          const prompt = `${clinicContext}\n\nPatient asks: "${text.trim()}"\nAssistant response:`;
          
          // Call Gemini
          const aiResponseText = await callGemini(prompt, apiKey);
          
          const aiMsg = await ChatMessage.create({
            senderName: 'Hopsontai Assistant (AI)',
            senderType: 'ai',
            guestSessionId: sessionId || null,
            receiverId: userId || null,
            messageText: aiResponseText
          });

          // Delay slightly to simulate AI typing
          setTimeout(() => {
            io.to(roomName).emit('new_message', aiMsg);
          }, 800);

        } catch (err) {
          console.error('AI Chatbot error:', err);
          const errorMsg = await ChatMessage.create({
            senderName: 'Hopsontai Assistant (AI)',
            senderType: 'ai',
            guestSessionId: sessionId || null,
            receiverId: userId || null,
            messageText: 'I am experiencing connection issues. Please try again or call our hotline: 091-444-4444.'
          });
          io.to(roomName).emit('new_message', errorMsg);
        }
      }
    });

    // Handle staff responses
    socket.on('staff_reply', async ({ text, targetRoom, staffId, staffName }) => {
      if (!text || !text.trim() || !targetRoom) return;

      const userId = targetRoom.startsWith('room_user_') ? targetRoom.replace('room_user_', '') : null;
      const guestId = targetRoom.startsWith('room_guest_') ? targetRoom.replace('room_guest_', '') : null;
      
      // Save staff response to database
      const staffMsg = await ChatMessage.create({
        senderId: staffId,
        senderName: staffName,
        senderType: 'staff',
        guestSessionId: guestId,
        receiverId: userId,
        messageText: text.trim()
      });

      // Emit to user room and to other staff sockets
      io.to(targetRoom).emit('new_message', staffMsg);
      io.to('room_staff').emit('new_message', staffMsg);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // console.log(`Socket disconnected: ${socket.id}`);
      if (socket.isStaff) {
        onlineStaff.delete(socket.id);
        if (onlineStaff.size === 0) {
          // Broadcast that staff is now offline
          io.emit('staff_status', { online: false });
        }
      }
    });
  });
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO
};
