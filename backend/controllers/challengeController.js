import challengeModel from "../models/challengeModel.js";
import incomeModel from "../models/incomeModel.js";
import expenseModel from "../models/expenseModel.js";

// Helper to convert date to start of day in UTC
const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 1. Create Challenge
export async function createChallenge(req, res) {
  const { title, description, challengeType, targetValue, categoryLimit, startDate, endDate } = req.body;
  const userId = req.user._id;

  try {
    if (!title || !challengeType || !targetValue || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const start = toStartOfDay(startDate);
    const end = toStartOfDay(endDate);

    if (end <= start) {
      return res.status(400).json({ success: false, message: "End date must be after start date" });
    }

    const newChallenge = new challengeModel({
      userId,
      title,
      description,
      challengeType,
      targetValue: Number(targetValue),
      categoryLimit: categoryLimit || "",
      startDate: start,
      endDate: end,
      status: "active",
    });

    await newChallenge.save();
    res.status(201).json({ success: true, message: "Challenge started successfully", challenge: newChallenge });
  } catch (error) {
    console.error("Create challenge error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// 2. Get and Evaluate Challenges
export async function getChallenges(req, res) {
  const userId = req.user._id;

  try {
    const challenges = await challengeModel.find({ userId });
    
    // Fetch user transactions to evaluate active challenges
    const incomes = await incomeModel.find({ userId });
    const expenses = await expenseModel.find({ userId });

    const today = toStartOfDay(new Date());

    const updatedChallenges = [];

    for (const challenge of challenges) {
      if (challenge.status !== "active") {
        updatedChallenges.push(challenge);
        continue;
      }

      const start = toStartOfDay(challenge.startDate);
      const end = toStartOfDay(challenge.endDate);

      // 1. Evaluate "Spend Limit"
      if (challenge.challengeType === "spend_limit") {
        const sumExpenses = expenses
          .filter(e => {
            const edate = toStartOfDay(e.date);
            return edate >= start && edate <= end;
          })
          .reduce((acc, e) => acc + e.amount, 0);

        challenge.progress = sumExpenses;

        if (sumExpenses > challenge.targetValue) {
          challenge.status = "failed";
          challenge.streak = 0;
        } else if (today > end) {
          challenge.status = "completed";
          challenge.streak = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
          challenge.maxStreak = challenge.streak;
          
          const badge = "Budget Ninja";
          if (!challenge.earnedBadges.includes(badge)) {
            challenge.earnedBadges.push(badge);
          }
        }
      } 
      // 2. Evaluate "Daily Save" & "Category Fast"
      else {
        let currentStreak = 0;
        let maxStreak = challenge.maxStreak || 0;
        let progressDays = 0;
        let isFailed = false;

        const maxEvaluateDate = today > end ? end : today;
        const totalDaysToEvaluate = Math.round((maxEvaluateDate - start) / (1000 * 60 * 60 * 24)) + 1;

        for (let dayOffset = 0; dayOffset < totalDaysToEvaluate; dayOffset++) {
          const evalDay = new Date(start);
          evalDay.setDate(start.getDate() + dayOffset);
          const evalDayTime = evalDay.getTime();

          if (challenge.challengeType === "daily_save") {
            const dayIncomes = incomes
              .filter(i => toStartOfDay(i.date).getTime() === evalDayTime)
              .reduce((acc, i) => acc + i.amount, 0);

            const dayExpenses = expenses
              .filter(e => toStartOfDay(e.date).getTime() === evalDayTime)
              .reduce((acc, e) => acc + e.amount, 0);

            const netSavings = dayIncomes - dayExpenses;

            if (netSavings >= challenge.targetValue) {
              currentStreak++;
              progressDays++;
              maxStreak = Math.max(maxStreak, currentStreak);
            } else {
              // Only reset streak if the day is strictly in the past (allow today to accumulate savings)
              if (evalDayTime < today.getTime()) {
                currentStreak = 0;
              }
            }
          } 
          else if (challenge.challengeType === "category_fast") {
            const categoryExpenses = expenses.filter(e => {
              const edate = toStartOfDay(e.date);
              return edate.getTime() === evalDayTime && 
                     e.category.toLowerCase() === challenge.categoryLimit.toLowerCase();
            });

            if (categoryExpenses.length > 0) {
              isFailed = true;
              currentStreak = 0;
              break; // Fast is broken, fail challenge immediately
            } else {
              currentStreak++;
              progressDays++;
              maxStreak = Math.max(maxStreak, currentStreak);
            }
          }
        }

        challenge.streak = currentStreak;
        challenge.maxStreak = maxStreak;
        challenge.progress = progressDays;

        if (isFailed) {
          challenge.status = "failed";
        } else if (today > end) {
          challenge.status = "completed";
          
          // Award badges based on milestones
          let badge = "";
          if (challenge.challengeType === "daily_save") {
            if (maxStreak >= 30) badge = "Savings Emperor";
            else if (maxStreak >= 7) badge = "Streak Warrior";
            else badge = "Savings Rookie";
          } else if (challenge.challengeType === "category_fast") {
            badge = "Self Control Master";
          }

          if (badge && !challenge.earnedBadges.includes(badge)) {
            challenge.earnedBadges.push(badge);
          }
        }
      }

      await challenge.save();
      updatedChallenges.push(challenge);
    }

    res.json({ success: true, challenges: updatedChallenges });
  } catch (error) {
    console.error("Evaluate challenges error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

// 3. Delete/Abandon Challenge
export async function deleteChallenge(req, res) {
  const { challengeId } = req.params;
  const userId = req.user._id;

  try {
    const challenge = await challengeModel.findOneAndDelete({ _id: challengeId, userId });
    if (!challenge) {
      return res.status(404).json({ success: false, message: "Challenge not found" });
    }
    res.json({ success: true, message: "Challenge abandoned/deleted successfully" });
  } catch (error) {
    console.error("Delete challenge error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
