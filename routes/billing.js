const express = require('express');
const router = express.Router();
const billing = require('../controllers/billing_control');
const { isEmployee } = require('../middleware/auth');

// Apply simple authentication - both admin and employees can access billing
router.use(isEmployee);

router.get('/', billing.getbilling);
router.post('/', billing.postBilling);
router.post('/generate-pdf', billing.generatePDF);

module.exports = router;
