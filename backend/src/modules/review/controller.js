const { DoctorReview, Patient, Appointment } = require('../../models');
const { APPOINTMENT_STATUS } = require('../../constants/enums');
const { success: ok, fail } = require('../../utils/response');

const createReview = async (req, res) => {
  try {
    const { doctorId, rating, comment } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return fail(res, 'Authentication required', 401);
    }

    if (!doctorId || !rating || !comment) {
      return fail(res, 'Doctor ID, rating, and comment are required', 400);
    }

    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return fail(res, 'Rating must be an integer between 1 and 5', 400);
    }

    // 1. Find the patient profile for the logged in user
    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return fail(res, 'Patient profile not found. Only patients can write reviews.', 404);
    }

    // 2. Check if patient has a Completed appointment with this doctor
    const completedAppt = await Appointment.findOne({
      patientId: patient._id,
      doctorId,
      status: APPOINTMENT_STATUS.COMPLETED
    });

    if (!completedAppt) {
      return fail(res, 'Bạn chỉ có thể đánh giá và bình luận sau khi đã hoàn thành lượt khám thực tế với bác sĩ này.', 400);
    }

    // 3. Prevent duplicate reviews by the same user for this doctor
    const existingReview = await DoctorReview.findOne({ doctorId, userId });
    if (existingReview) {
      return fail(res, 'Bạn đã gửi đánh giá cho bác sĩ này rồi.', 400);
    }

    // 4. Create the new review
    const review = await DoctorReview.create({
      doctorId,
      userId,
      patientName: patient.fullName,
      rating: ratingNum,
      comment: comment.trim()
    });

    return ok(res, review, 'Review submitted successfully', 201);
  } catch (error) {
    console.error('createReview error', error);
    return fail(res, 'Server error when submitting review', 500, error.message);
  }
};

const getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!doctorId) {
      return fail(res, 'Doctor ID is required', 400);
    }

    const reviews = await DoctorReview.find({ doctorId }).sort({ createdAt: -1 });
    return ok(res, reviews, 'Doctor reviews fetched successfully');
  } catch (error) {
    console.error('getDoctorReviews error', error);
    return fail(res, 'Server error when fetching doctor reviews', 500, error.message);
  }
};

const checkReviewEligibility = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return ok(res, { eligible: false, reason: 'unauthenticated' });
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
      return ok(res, { eligible: false, reason: 'no_patient_profile' });
    }

    // 1. Check if patient has a Completed appointment with this doctor
    const completedAppt = await Appointment.findOne({
      patientId: patient._id,
      doctorId,
      status: APPOINTMENT_STATUS.COMPLETED
    });

    if (!completedAppt) {
      return ok(res, { eligible: false, reason: 'no_completed_appointment' });
    }

    // 2. Check if already reviewed
    const existingReview = await DoctorReview.findOne({ doctorId, userId });
    if (existingReview) {
      return ok(res, { eligible: false, reason: 'already_reviewed' });
    }

    return ok(res, { eligible: true });
  } catch (error) {
    console.error('checkReviewEligibility error', error);
    return fail(res, 'Server error checking eligibility', 500, error.message);
  }
};

module.exports = {
  createReview,
  getDoctorReviews,
  checkReviewEligibility
};
