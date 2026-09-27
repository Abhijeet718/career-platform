const pdfParse = require('pdf-parse');
const userModel = require('../models/user.model');
const { analyzeResume } = require('../services/ai.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const analyzeResumeController = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'A PDF resume file is required');
    }

    const { targetRole } = req.body;

    let resumeText;
    try {
        const pdfInstance = new pdfParse.PDFParse(Uint8Array.from(req.file.buffer));
        const result = await pdfInstance.getText();
        resumeText = result.text;
    } catch (parseError) {
        throw new ApiError(400, 'Could not read the PDF file. Please ensure it is a valid document.');
    }

    if (!resumeText || resumeText.trim().length < 20) {
        throw new ApiError(400, 'Could not extract enough readable text from this PDF.');
    }

    const analysis = await analyzeResume({ resumeText, targetRole });

    const user = await userModel.findById(req.user.id);
    user.skills = (analysis.extractedSkills || []).map((s) => s.toLowerCase().trim());
    user.resumeText = resumeText;
    await user.save();

    return res.status(200).json(
        new ApiResponse(200, {
            analysis,
            updatedSkills: user.skills
        }, 'Resume analyzed successfully')
    );
});

module.exports = { analyzeResumeController };