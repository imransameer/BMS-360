/**
 * Common logout functionality for all pages - Sidebar version
 */
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to logout?')) {
                // Show loading state in sidebar
                const originalContent = logoutBtn.innerHTML;
                logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Logging out...</span>';
                logoutBtn.style.pointerEvents = 'none';
                
                fetch('/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Show success message briefly
                        logoutBtn.innerHTML = '<i class="fas fa-check"></i><span>Logged out!</span>';
                        
                        // Redirect to login page
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 500);
                    } else {
                        // Reset button state
                        logoutBtn.innerHTML = originalContent;
                        logoutBtn.style.pointerEvents = 'auto';
                        alert('Logout failed. Please try again.');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    // Reset button state
                    logoutBtn.innerHTML = originalContent;
                    logoutBtn.style.pointerEvents = 'auto';
                    alert('An error occurred during logout.');
                });
            }
        });
    }
});
