// Contact information decoder - protects against scrapers
(function() {
    // Encoded contact information (Base64 + character shifting)
    const encodedData = {
        email: 'cGl6emptZWRwY2FsYnV1cmVhY2hAaG5hcGwuZGJu',
        phone: 'KzM2NyA4OTMgOTczODg4'
    };
    
    function decode(str) {
        // Decode Base64
        let decoded = atob(str);
        // Reverse character shifting (shift back by 1)
        return decoded.split('').map(char => 
            String.fromCharCode(char.charCodeAt(0) - 1)
        ).join('');
    }
    
    function displayContacts() {
        const email = decode(encodedData.email);
        const phone = decode(encodedData.phone);
        
        // Update top bar
        const emailEl = document.getElementById('email-contact');
        const phoneEl = document.getElementById('phone-contact');
        
        if (emailEl) emailEl.textContent = email;
        if (phoneEl) phoneEl.textContent = phone;
        
        // Update footer
        const footerEmailEl = document.getElementById('footer-email');
        const footerPhoneEl = document.getElementById('footer-phone');
        
        if (footerEmailEl) footerEmailEl.textContent = email;
        if (footerPhoneEl) footerPhoneEl.textContent = phone;
    }
    
    // Load when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', displayContacts);
    } else {
        displayContacts();
    }
})();