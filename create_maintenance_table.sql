-- Create maintenance_expenses table for tracking daily expenses
CREATE TABLE IF NOT EXISTS maintenance_expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_date DATE NOT NULL,
    expense_type ENUM('Rent', 'Maintenance', 'Repair', 'Electricity', 'Water', 'Internet', 'AMC', 'Miscellaneous') NOT NULL,
    brief VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert some sample data for today to test the functionality
INSERT INTO maintenance_expenses (entry_date, expense_type, brief, amount) VALUES
(CURDATE(), 'Electricity', 'Monthly electricity bill', 2500.00),
(CURDATE(), 'Maintenance', 'AC servicing', 1500.00),
(CURDATE(), 'Internet', 'Internet bill', 800.00);
