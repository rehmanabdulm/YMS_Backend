const mongoose = require('mongoose');

const InwardFormSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  agreementNumber: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  variant: { type: String, required: true },
  refNo: { type: String, required: true },
  segment: { type: String, required: true },
  geoLocation: { type: String, required: true },
  inwardDateTime: { type: String, required: true },
});

const InwardForm = mongoose.model('InwardForm', InwardFormSchema);

module.exports = InwardForm;
