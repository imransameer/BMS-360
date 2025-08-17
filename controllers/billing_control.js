const path = require('path'); 
const billingModel = require('../models/billingModel');
const inventoryModel = require('../models/inventoryModel');

const getbilling = (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'billing.html'));
};

// Function to take the data from the billing form and send it to the model
const postBilling = async (req, res) => {
    try {
        // Extract bill person data from form
        const {
            customerName,
            customerPhone,
            customerAgeGroup,
            paymentMethod,
            discount
        } = req.body;

        // Extract bill items from form (now sent as array)
        let billItems = Array.isArray(req.body.billItems) ? req.body.billItems : [];
        if (!Array.isArray(billItems)) {
            return res.status(400).json({ error: 'Invalid bill items data' });
        }
        
        // Validate each bill item has required fields
        for (const item of billItems) {
            if (!item.name || !item.item_code || typeof item.qty !== 'number' || typeof item.price !== 'number') {
                return res.status(400).json({ error: 'Each bill item must have name, item_code, qty (number), and price (number)' });
            }
        }

        // Calculate subtotal, gst, grand_total
        let subtotal = 0;
        billItems.forEach(item => {
            subtotal += (item.price * item.qty);
        });
        const gst = +(subtotal * 0.18).toFixed(2);
        const discountValue = parseFloat(discount) || 0;
        const grand_total = +(subtotal + gst - discountValue).toFixed(2);

        // Generate bill_date
        const bill_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Update inventory stock for each item before saving bill
        let stockErrors = [];
        for (const item of billItems) {
            try {
                await inventoryModel.updateStock(item.item_code, item.qty);
            } catch (err) {
                stockErrors.push(`${item.name} (code: ${item.item_code})`);
            }
        }
        if (stockErrors.length > 0) {
            return res.status(400).json({ error: `Not enough stock for: ${stockErrors.join(', ')}` });
        }

        // Prepare bill data
        const billData = {
            bill_date,
            customer_name: customerName,
            customer_phone: customerPhone,
            customer_age_group: customerAgeGroup,
            subtotal,
            gst,
            discount: discountValue,
            grand_total,
            payment_method: paymentMethod
        };

        // Prepare bill items for saving
        const formattedBillItems = billItems.map(item => ({
            item_code: item.item_code,
            item_name: item.name,
            item_price: item.price,
            quantity: item.qty,
            total: +(item.price * item.qty).toFixed(2)
        }));

        // Save complete bill with items in a transaction
        const result = await billingModel.saveCompleteBill(billData, formattedBillItems);
        return res.json({ success: true, bill_id: result.bill_id });
        
    } catch (err) {
        console.error('Error saving bill:', err);
        return res.status(500).json({ error: 'Failed to save bill. Try again.' });
    }
};

// Generate PDF for a bill (alternative server-side approach)
const generatePDF = async (req, res) => {
    try {
        const { billData } = req.body;
        
        // Validate bill data
        if (!billData || !billData.items || billData.items.length === 0) {
            return res.status(400).json({ error: 'Invalid bill data' });
        }
        
        // For now, return success - PDF generation would be handled client-side
        // This could be extended to use server-side PDF libraries like puppeteer
        res.json({ 
            success: true, 
            message: 'PDF generation data processed',
            data: billData 
        });
        
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};

module.exports = {
    getbilling,
    postBilling,
    generatePDF
};
