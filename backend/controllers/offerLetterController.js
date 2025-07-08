const mongoose = require('mongoose');
const generateOfferPDFBuffer = require('../utils/pdfGenerator');
const { uploadOfferLetterBuffer } = require('../utils/multer');
const OfferLetter = require('../models/webapp-models/offerLetterModel');
const notifyUser = require('../utils/notifyUser');
const sendNotification = require('../utils/Notification');

const sendOfferLetter = async (req, res) => {
  try {
    const {
      student_id: studentId,
      name,
      email,
      position,
      startDate,
      internshipId,
      schoolAdminId,
      company,
      location,
      duration,
      internshipType,
      compensationDetails,
      jobDescription,
      qualifications,
      contactInfo,
      noticePeriod
    } = req.body;

    const requiredFields = ['student_id', 'name', 'email', 'position', 'startDate', 'internshipId'];
    const missing = requiredFields.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({ error: 'Missing required fields', missing });
    }

    let studentObjId, internshipObjId, normalizedStart;
    try {
      studentObjId = new mongoose.Types.ObjectId(studentId);
      internshipObjId = new mongoose.Types.ObjectId(internshipId);
      normalizedStart = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      if (isNaN(normalizedStart.getTime())) throw new Error('Invalid startDate');
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const pdfBuffer = await generateOfferPDFBuffer({
      name,
      email,
      position,
      startDate,
      internshipId,
      companyName: company,
      location,
      duration,
      internshipType,
      compensationDetails,
      jobDescription,
      qualifications,
      contactInfo,
      noticePeriod
    });

    const fileName = `offer-${studentId}-${Date.now()}.pdf`;
    const s3Url = await uploadOfferLetterBuffer(pdfBuffer, fileName);

    const offerDoc = {
      studentId: studentObjId,
      internshipId: internshipObjId,
      name,
      email,
      position,
      startDate: normalizedStart,
      sentDate: new Date(),
      status: 'Sent',
      s3Url,
      qualifications: qualifications || [],
      schoolAdminId: schoolAdminId && mongoose.Types.ObjectId.isValid(schoolAdminId)
        ? new mongoose.Types.ObjectId(schoolAdminId)
        : null
    };

    const offerLetter = await OfferLetter.create(offerDoc);

    sendNotification({
      studentId,
      title: 'Offer Letter Sent!',
      message: `Congratulations ${name}, your offer for "${position}" is live.`,
      link: s3Url
    }).catch(err => console.error('In-app notification failed:', err));

    notifyUser(
      email,
      'Your SkillNaav Offer Letter',
      `Hi ${name}, <a href="${s3Url}">download your offer letter</a>.`
    ).catch(err => console.error('Email notification failed:', err));

    return res.status(201).json({
      message: 'Offer letter sent successfully',
      offerLetter: {
        _id: offerLetter._id,
        studentId: offerLetter.studentId,
        position: offerLetter.position,
        startDate: offerLetter.startDate,
        downloadUrl: s3Url
      }
    });
  } catch (err) {
    console.error('Offer Letter Error:', err);
    return res.status(500).json({
      error: err.message || 'Failed to process offer letter'
    });
  }
};

const getOfferLetterByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const offer = await OfferLetter.findOne({ studentId });
    if (!offer) {
      return res.status(404).json({ error: 'No offer letter found for this student' });
    }

    return res.status(200).json(offer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Accepted or Rejected' });
    }

    const offer = await OfferLetter.findByIdAndUpdate(id, { status }, { new: true });
    if (!offer) {
      return res.status(404).json({ error: 'Offer letter not found' });
    }

    return res.status(200).json({ message: `Offer ${status.toLowerCase()} successfully`, offer });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getOffersByInternship = async (req, res) => {
  const { internshipId } = req.params;
  const { schoolAdminId } = req.query;

  const query = { internshipId: new mongoose.Types.ObjectId(internshipId) };

  if (schoolAdminId && mongoose.Types.ObjectId.isValid(schoolAdminId)) {
    query.schoolAdminId = new mongoose.Types.ObjectId(schoolAdminId);
  }

  const offers = await OfferLetter.find(query);
  return res.status(200).json({ offers });
};


module.exports = {
  sendOfferLetter,
  getOfferLetterByStudent,
  updateOfferStatus,
  getOffersByInternship
};
