const multer = require('multer');
const mammoth = require('mammoth');
const ResumeReview = require('../models/ResumeReview');
const { reviewResume } = require('../services/aiService');

// Configure multer for in-memory file storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed.'), false);
    }
  },
});

/**
 * Extract text from uploaded file buffer based on mimetype.
 */
const extractText = async (buffer, mimetype) => {
  if (mimetype === 'application/pdf') {
    return new Promise((resolve, reject) => {
      try {
        const PDFParser = require('pdf2json');
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', (err) => {
          console.error("PDF parse actual error:", err.parserError);
          reject(new Error('PDF_PARSE_ERROR'));
        });

        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            console.log('PDF pages found:', pdfData.Pages?.length);
            console.log('First page texts:', JSON.stringify(pdfData.Pages?.[0]?.Texts?.slice(0, 3)));

            const text = pdfData.Pages.map(page =>
              page.Texts.map(t =>
                t.R.map(r => {
                  try {
                    return decodeURIComponent(r.T);
                  } catch {
                    return r.T;
                  }
                }).join('')
              ).join(' ')
            ).join('\n');

            console.log('Extracted text length:', text.length);
            console.log('Extracted text preview:', text.substring(0, 200));
            resolve(text.trim());
          } catch (e) {
            console.error('Data ready parse error:', e.message, e.stack);
            reject(new Error('PDF_PARSE_ERROR'));
          }
        });

        console.log('Buffer received, size:', buffer.length);
        pdfParser.parseBuffer(buffer);
      } catch (err) {
        console.error("PDF parse actual error:", err.message, err.stack);
        reject(new Error('PDF_PARSE_ERROR'));
      }
    });
  }
  // DOCX
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
};

/**
 * POST /api/resume/review
 * Upload a resume and get AI analysis.
 */
const handleReviewResume = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer || req.file.buffer.length === 0) {
      console.error("Resume upload error: req.file.buffer is missing or empty");
      return res.status(400).json({ message: "File upload failed. No data received from the uploaded file." });
    }

    const { buffer, mimetype, originalname } = req.file;
    const fileType = mimetype === 'application/pdf' ? 'pdf' : 'docx';

    // 1. Extract text
    let resumeText = '';
    try {
      resumeText = await extractText(buffer, mimetype);
    } catch (parseError) {
      return res.status(400).json({
        message: 'Could not extract text from the uploaded PDF. Please ensure it is a text-based PDF and not a scanned image.',
      });
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        message: 'Could not extract meaningful text from this PDF. Please ensure it is not a scanned image or image-based PDF.',
      });
    }

    // 2. AI analysis
    const analysis = await reviewResume(resumeText);

    // Catch AI failure
    if (analysis.atsScore === 0 && analysis.strengths.length === 0) {
      return res.status(500).json({ message: 'AI analysis failed. Please try again in a moment.' });
    }

    // 3. Persist to DB
    const review = await ResumeReview.create({
      userId: req.user._id,
      fileName: originalname,
      fileType,
      atsScore: analysis.atsScore,
      strengths: analysis.strengths,
      weaknesses: analysis.weaknesses,
      recommendations: analysis.recommendations,
      detailedFeedback: analysis.detailedFeedback,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Resume review error:', error.message);
    res.status(500).json({ message: 'Failed to review resume. Please try again.' });
  }
};

/**
 * GET /api/resume/history
 * List all reviews for the authenticated user (newest first).
 */
const getReviewHistory = async (req, res) => {
  try {
    const reviews = await ResumeReview.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-detailedFeedback');
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching review history:', error.message);
    res.status(500).json({ message: 'Failed to fetch review history.' });
  }
};

/**
 * GET /api/resume/:id
 * Get a single review by ID.
 */
const getReviewById = async (req, res) => {
  try {
    const review = await ResumeReview.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    res.json(review);
  } catch (error) {
    console.error('Error fetching review:', error.message);
    res.status(500).json({ message: 'Failed to fetch review.' });
  }
};

module.exports = { upload, handleReviewResume, getReviewHistory, getReviewById };