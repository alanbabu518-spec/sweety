const express = require("express");
const requireAuth = require("../middleware/auth");
const service = require("../services/reportsService");
const { todayString, isValidDateString } = require("../utils/dates");
const { HttpError, asyncHandler } = require("../utils/errors");

const router = express.Router();
router.use(requireAuth);

const getDate = (req) => {
  const date = req.query.date || todayString();
  if (!isValidDateString(date))
    throw new HttpError("Please choose a valid date.");
  return date;
};

router.get(
  "/daily",
  asyncHandler(async (req, res) => {
    res.json({ report: await service.dailyReport(req.user.id, getDate(req)) });
  }),
);

router.get(
  "/month-to-date",
  asyncHandler(async (req, res) => {
    res.json({
      report: await service.monthToDateReport(req.user.id, getDate(req)),
    });
  }),
);

router.get(
  "/monthly",
  asyncHandler(async (req, res) => {
    res.json({
      report: await service.monthlyReport(req.user.id, getDate(req)),
    });
  }),
);

module.exports = router;
