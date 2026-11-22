const { GoogleGenerativeAI } = require('@google/generative-ai');
const Student = require('../models/Student.model');
const Class = require('../models/Class.model');
const Timetable = require('../models/Timetable');
const StudyMaterial = require('../models/StudyMaterial.model');
const { sendSuccess, sendError } = require('../utils/response.utils');

// List of models to try in order of preference
const MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-pro"
];

exports.processChat = async (req, res) => {
  console.log('--- Chat Process Started ---');
  try {
    const { message } = req.body;
    if (!message) return sendError(res, 400, 'Message is required');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: GEMINI_API_KEY missing in .env');
      return sendError(res, 500, 'AI Configuration Error: Missing API Key');
    }

    // 1. Context Gathering (with safety checks)
    let contextString = `User: ${req.user?.name || 'Unknown'}, Role: ${req.user?.role || 'user'}`;
    
    try {
      if (req.user?.role === 'student') {
        const student = await Student.findOne({ userId: req.user._id })
          .populate({ path: 'enrolledClasses', populate: { path: 'teacher', select: 'name' } });

        if (student) {
          const classIds = (student.enrolledClasses || []).map(c => c._id).filter(id => id);
          const classesInfo = (student.enrolledClasses || []).map(c => `- ${c.name || 'Unnamed'} (Subject: ${c.subject || 'N/A'})`).join('\n') || 'None';
          
          const timetableSlots = await Timetable.find({ class: { $in: classIds }, isActive: true }).populate('class', 'name');
          const timetableInfo = timetableSlots.map(t => `- ${t.day}: ${t.subject} (${t.startTime}-${t.endTime})`).join('\n') || 'No timetable available';
          
          const materials = await StudyMaterial.find({ classId: { $in: classIds } }).limit(5);
          const materialsInfo = materials.map(m => `- ${m.title}`).join('\n') || 'No materials found';

          contextString = `Student Profile: ${req.user.name}\nRoll: ${student.rollNumber}\nClasses:\n${classesInfo}\nTimetable:\n${timetableInfo}\nMaterials:\n${materialsInfo}`;
        }
      } else if (req.user?.role === 'teacher') {
        const classes = await Class.find({ teacher: req.user._id });
        const classInfo = classes.map(c => `- ${c.name} (${c.subject})`).join('\n') || 'None';
        contextString = `Teacher Profile: ${req.user.name}\nClasses:\n${classInfo}`;
      }
    } catch (contextError) {
      console.error('Context gathering failed (non-critical):', contextError.message);
      // We continue even if context fails
    }

    const systemPrompt = `You are "AttendEase AI". Use this context if relevant:\n${contextString}\n\nHelp the user with academic questions.`;

    // 2. AI Generation with multi-model fallback
    const genAI = new GoogleGenerativeAI(apiKey);
    let responseText = null;
    let errorDetails = '';

    for (const modelName of MODELS_TO_TRY) {
      try {
        console.log(`Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // Use a timeout for the AI call to prevent hanging
        const result = await Promise.race([
          model.generateContent(`${systemPrompt}\n\nUser Question: ${message}`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), 15000))
        ]);

        const response = await result.response;
        responseText = response.text();
        
        if (responseText) {
          console.log(`Success with ${modelName}`);
          break; 
        }
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err.message);
        errorDetails += `${modelName}: ${err.message}. `;
      }
    }

    if (responseText) {
      return sendSuccess(res, 200, 'Success', { response: responseText });
    }

    // 3. Last Resort Fallback (If all AI models fail)
    console.error('All AI models failed. errorDetails:', errorDetails);
    const fallback = `I'm currently having trouble connecting to my AI brain (All models returned errors: ${errorDetails}). \n\nHowever, I can still help! You are logged in as **${req.user.name}**. You can view your classes and materials using the dashboard links while I try to reconnect!`;
    
    return sendSuccess(res, 200, 'Fallback Active', { response: fallback });

  } catch (globalError) {
    console.error('GLOBAL CHAT CRASH:', globalError);
    return sendError(res, 500, `Critical Chat Failure: ${globalError.message}`);
  }
};
