import mongoose from 'mongoose';

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'Resume Based' },
    resumeReference: { type: String, default: 'Resume based' },
    expectedSignals: [{ type: String }],
    askedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    targetRole: {
      type: String,
      required: true,
      trim: true
    },
    experience: {
      type: String,
      required: true,
      trim: true
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    questionCount: {
      type: Number,
      default: 5
    },
    resumeText: {
      type: String,
      required: true
    },
    resumeAnalysis: {
      summary: { type: String, default: '' },
      skills: [{ type: String }],
      projects: [{ type: String }],
      likelyStrengths: [{ type: String }],
      possibleGaps: [{ type: String }],
      focusAreas: [{ type: String }]
    },
    qa: [qaSchema],
    report: {
      overallScore: { type: Number, default: 0 },
      communicationScore: { type: Number, default: 0 },
      technicalScore: { type: Number, default: 0 },
      confidenceScore: { type: Number, default: 0 },
      resumeAlignmentScore: { type: Number, default: 0 },
      projectDepthScore: { type: Number, default: 0 },
      summary: { type: String, default: '' },
      strengths: [{ type: String }],
      improvements: [{ type: String }],
      detailedFeedback: [
        {
          question: String,
          answerQuality: String,
          idealPoints: [String],
          resumeConnection: String,
          score: Number
        }
      ],
      resumeConcerns: [{ type: String }],
      nextPrepPlan: [{ type: String }],
      recommendation: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
