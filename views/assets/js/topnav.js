console.log('topnav.js loaded');
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
        // Update greeting based on time of day
        updateGreeting();
        
        // Update date display
        updateDateDisplay();
        
        // Add calendar popup functionality
        setupCalendarPopup();
        
        // Functions
        function updateGreeting() {
            const greetingText = document.getElementById('greetingText');
            const greetingIcon = document.getElementById('greetingIcon');
            
            if (!greetingText || !greetingIcon) return;
            
            const hour = new Date().getHours();
            let greeting, iconClass;
            
            if (hour >= 5 && hour < 12) {
                greeting = 'Good Morning,';
                iconClass = 'fas fa-sun text-warning';
            } else if (hour >= 12 && hour < 17) {
                greeting = 'Good Afternoon,';
                iconClass = 'fas fa-sun text-warning';
            } else if (hour >= 17 && hour < 21) {
                greeting = 'Good Evening,';
                iconClass = 'fas fa-moon text-primary';
            } else {
                greeting = 'Good Night,';
                iconClass = 'fas fa-moon text-primary';
            }
            
            greetingText.textContent = greeting;
            greetingIcon.className = iconClass + ' me-2';
        }
        
        function updateDateDisplay() {
            const fullDate = document.getElementById('fullDate');
            const shortDate = document.getElementById('shortDate');
            
            if (!fullDate || !shortDate) return;
            
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const shortOptions = { month: 'short', day: 'numeric' };
            
            fullDate.textContent = now.toLocaleDateString('en-US', options);
            shortDate.textContent = now.toLocaleDateString('en-US', shortOptions);
        }
        
        function setupCalendarPopup() {
            const dateContainer = document.getElementById('dateContainer');
            
            if (!dateContainer) return;
            
            dateContainer.style.cursor = 'pointer';
            
            dateContainer.addEventListener('click', function() {
                // Check if modal already exists
                let calendarModal = document.getElementById('calendarModal');
                
                if (!calendarModal) {
                    // Create modal if it doesn't exist
                    calendarModal = document.createElement('div');
                    calendarModal.id = 'calendarModal';
                    calendarModal.className = 'modal fade';
                    calendarModal.setAttribute('tabindex', '-1');
                    calendarModal.setAttribute('aria-labelledby', 'calendarModalLabel');
                    calendarModal.setAttribute('aria-hidden', 'true');
                    
                    const modalHTML = `
                        <div class="modal-dialog">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="calendarModalLabel">Calendar</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                ${generateCalendarHTML()}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            </div>
                        </div>
                    </div>
                    `;
                    
                    calendarModal.innerHTML = modalHTML;
                    document.body.appendChild(calendarModal);
                }
                
                // Initialize and show the modal
                const modal = new bootstrap.Modal(calendarModal);
                modal.show();
            });
        }
        
        function generateCalendarHTML() {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            const currentDay = now.getDate();
            
            // Month names
            const monthNames = [
                'January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            // Day names
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            // First day of the month
            const firstDay = new Date(currentYear, currentMonth, 1).getDay();
            
            // Last date of the month
            const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            // Generate the calendar HTML
            let calendarHTML = `
                <div class="text-center mb-3">
                    <h4>${monthNames[currentMonth]} ${currentYear}</h4>
                </div>
                <table class="table table-bordered text-center">
                    <thead>
                        <tr>
                            ${dayNames.map(day => `<th>${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            let date = 1;
            for (let i = 0; i < 6; i++) {
                calendarHTML += '<tr>';
                
                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < firstDay) {
                        // Empty cells before the first day of the month
                        calendarHTML += '<td></td>';
                    } else if (date > lastDate) {
                        // Empty cells after the last day of the month
                        calendarHTML += '<td></td>';
                    } else {
                        // Highlight current day
                        if (date === currentDay) {
                            calendarHTML += `<td class="bg-primary text-white">${date}</td>`;
                        } else {
                            calendarHTML += `<td>${date}</td>`;
                        }
                        date++;
                    }
                }
                
                calendarHTML += '</tr>';
                
                // Stop generating rows if we've reached the end of the month
                if (date > lastDate) {
                    break;
                }
            }
            
            calendarHTML += `
                    </tbody>
                </table>
            `;
            
            return calendarHTML;
        }
    });
