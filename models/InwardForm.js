const mongoose = require('mongoose');

// Define the checklist item schema
const ChecklistItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  yes: { type: Boolean, default: false },
  no: { type: Boolean, default: false }
});

// Define the main schema
const InwardFormSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  agreementNumber: { type: String, required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  variant: { type: String, required: true },
  refNo: { type: String, required: true },
  segment: { type: String, required: true },
  loanNo: { type: String, required: true },
  fuelType: { type: String, required: true },
  odometerReading: { type: String, required: true },
  yard: { type: String, required: true },
  inwardDateTime: { type: String, required: true },

  geoLocation: { type: String, required: true },


  // Vehicle Details section
  vehicleDetails: {
    customerName: { type: String, required: true },
    engineNumber: { type: String, required: true },
    chassisNumber: { type: String, required: true },
    color: { type: String, required: true },
    vehicleClass: { type: String, required: true },
    vehicleCondition: { type: String, required: true },
    keyLocation: { type: String, required: true },
    transmission: { type: String, required: true },
    remarks: { type: String }
  },

  // Checklist section as an array of ChecklistItem
  checklist: {
    type: [ChecklistItemSchema],
    default: [
      { label: "Key", yes: false, no: false },
      { label: "Light", yes: false, no: false },
      { label: "Horns", yes: false, no: false },
      { label: "Wiper Blade", yes: false, no: false },
      { label: "Back Wiper", yes: false, no: false },
      { label: "Music System", yes: false, no: false },
      { label: "Roast Light", yes: false, no: false },
      { label: "Speaker", yes: false, no: false },
      { label: "Roof Light", yes: false, no: false },
      { label: "Fan", yes: false, no: false },
      { label: "Rear View", yes: false, no: false },
      { label: "Door Mirror", yes: false, no: false },
      { label: "Sun Visor", yes: false, no: false },
      { label: "Rain Visor", yes: false, no: false },
      { label: "Fuel Cap", yes: false, no: false },
      { label: "Battery Make", yes: false, no: false },
      { label: "Battery", yes: false, no: false },
      { label: "Door Handle", yes: false, no: false },
      { label: "Door Glass", yes: false, no: false },
      { label: "Stepney", yes: false, no: false },
      { label: "Jack", yes: false, no: false },
      { label: "Jack Rod", yes: false, no: false },
      { label: "Wheel Spanner", yes: false, no: false },
      { label: "Tool", yes: false, no: false },
      { label: "Rope", yes: false, no: false },
      { label: "Tarpaulin", yes: false, no: false },
      { label: "Cultivator", yes: false, no: false },
      { label: "Tyre", yes: false, no: false }
    ]
  },

  // Vehicle Photos section to store URLs for each view
  vehiclePhotos: {
    frontView: { type: String, default: null },
    rightView: { type: String, default: null },
    backView: { type: String, default: null },
    leftView: { type: String, default: null },
    engineView: { type: String, default: null },
    meterReading: { type: String, default: null }
  }
});

const InwardForm = mongoose.model('InwardForm', InwardFormSchema);

module.exports = InwardForm;
