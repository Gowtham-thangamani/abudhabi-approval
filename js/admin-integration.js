/**
 * Abu Dhabi Approval - Admin Integration Script
 * This script applies admin panel settings to the website
 * 
 * Add to your HTML pages before </body>:
 * <script src="js/admin-integration.js"></script>
 */

(function() {
    'use strict';

    // Blog pagination settings
    const BLOGS_PER_PAGE = 6;
    let currentBlogsDisplayed = 0;

    // Fix Navigation Active State based on current page
    function fixNavigationActive() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.header-nav .nav.navbar-nav > li');
        
        navLinks.forEach(li => {
            li.classList.remove('active');
            const link = li.querySelector('a');
            if (link) {
                const href = link.getAttribute('href');
                // Check if current page matches the link
                if (href === currentPage || 
                    (currentPage === '' && href === 'index.html') ||
                    (currentPage === 'index.html' && href === 'index.html') ||
                    (currentPage.includes('about') && href === 'about.html') ||
                    (currentPage.includes('service') && href === 'services.html') ||
                    (currentPage.includes('blog') && href === 'blog.html') ||
                    (currentPage.includes('contact') && href === 'contact.html')) {
                    li.classList.add('active');
                }
            }
        });
    }

    // Load Blogs Dynamically from localStorage
    function loadBlogs(showAll = false) {
        const blogsContainer = document.getElementById('dynamic-blogs-container');
        if (!blogsContainer) return;

        let blogs = JSON.parse(localStorage.getItem('adaBlogPosts')) || [];
        
        // Filter only published blogs
        blogs = blogs.filter(b => b.published !== false);
        
        // Sort by date (newest first)
        blogs.sort((a, b) => {
            const dateA = new Date(a.rawDate || a.createdAt || 0);
            const dateB = new Date(b.rawDate || b.createdAt || 0);
            return dateB - dateA;
        });

        const totalBlogs = blogs.length;
        const blogsToShow = showAll ? totalBlogs : Math.min(BLOGS_PER_PAGE, totalBlogs);
        currentBlogsDisplayed = blogsToShow;

        if (blogs.length === 0) {
            blogsContainer.innerHTML = `
                <div class="col-12 text-center p-tb50">
                    <h4>No blog posts available yet.</h4>
                    <p>Check back soon for new content!</p>
                </div>`;
            hideShowMoreButton();
            return;
        }

        let html = '';
        for (let i = 0; i < blogsToShow; i++) {
            const blog = blogs[i];
            html += generateBlogHTML(blog, i);
        }

        blogsContainer.innerHTML = html;

        // Show/Hide "Show More" button
        const showMoreBtn = document.getElementById('show-more-blogs-btn');
        if (showMoreBtn) {
            if (currentBlogsDisplayed < totalBlogs) {
                showMoreBtn.style.display = 'inline-block';
                showMoreBtn.textContent = 'SHOW MORE';
            } else {
                showMoreBtn.style.display = 'none';
            }
        }
    }

    // Load more blogs when button is clicked
    function loadMoreBlogs() {
        const blogsContainer = document.getElementById('dynamic-blogs-container');
        if (!blogsContainer) return;

        let blogs = JSON.parse(localStorage.getItem('adaBlogPosts')) || [];
        blogs = blogs.filter(b => b.published !== false);
        blogs.sort((a, b) => {
            const dateA = new Date(a.rawDate || a.createdAt || 0);
            const dateB = new Date(b.rawDate || b.createdAt || 0);
            return dateB - dateA;
        });

        const totalBlogs = blogs.length;
        const nextBatch = Math.min(currentBlogsDisplayed + BLOGS_PER_PAGE, totalBlogs);

        let html = '';
        for (let i = currentBlogsDisplayed; i < nextBatch; i++) {
            const blog = blogs[i];
            html += generateBlogHTML(blog, i);
        }

        blogsContainer.insertAdjacentHTML('beforeend', html);
        currentBlogsDisplayed = nextBatch;

        // Update "Show More" button
        const showMoreBtn = document.getElementById('show-more-blogs-btn');
        if (showMoreBtn) {
            if (currentBlogsDisplayed < totalBlogs) {
                showMoreBtn.textContent = 'SHOW MORE';
            } else {
                showMoreBtn.style.display = 'none';
            }
        }
    }

    // Generate HTML for a single blog post
    function generateBlogHTML(blog, index) {
        const blogImage = blog.img || 'images/blog/default/building-permit.jpg';
        const blogDate = formatBlogDate(blog.rawDate || blog.date || blog.createdAt);
        const blogSlug = blog.slug || blog.id;
        const blogLink = `blog-details.html?id=${blog.id}`;
        
        // Check if there's a static blog-details page for this blog
        const staticLinks = {
            'blog_1': 'blog-details1.html',
            'blog_2': 'blog-details2.html',
            'blog_3': 'blog-details3.html',
            'blog_4': 'blog-details4.html',
            'blog_5': 'blog-details5.html',
            'blog_6': 'blog-details6.html',
            'blog_7': 'blog-details7.html'
        };
        const detailsLink = staticLinks[blog.id] || blogLink;

        return `
        <!-- Blog Post ${index + 1} -->
        <div class="section-full p-tb40 inner-page-padding blog-item" data-blog-id="${blog.id}">
            <div class="container">
                <div class="row">
                    <div class="col-lg-6 col-md-6">
                        <div class="news-listing">
                            <div class="blog-post blog-lg date-style-3 block-shadow">
                                <div class="mt-post-media mt-img-effect zoom-slow">
                                    <a href="${detailsLink}"><img src="${blogImage}" alt="${blog.title}" onerror="this.src='images/blog/default/building-permit.jpg'"></a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6 col-md-6">
                        <div class="mt-post-info p-a30 p-m30 bg-white">
                            <div class="mt-post-title">
                                <h4 class="post-title"><a href="${detailsLink}">${blog.title || 'Untitled Post'}</a></h4>
                            </div>
                            <div class="mt-post-meta">
                                <ul>
                                    <li class="post-date"><i class="fa fa-calendar site-text-primary"></i><strong>${blogDate.day} ${blogDate.month}</strong> <span>${blogDate.year}</span></li>
                                    <li class="post-author"><i class="fa fa-user site-text-primary"></i>By <span>Admin</span></li>
                                    <li class="post-comment"><i class="fa fa-comments site-text-primary"></i>${blog.viewCount || 0} Views</li>
                                </ul>
                            </div>
                            <div class="mt-post-text">
                                <p>${blog.excerpt || truncateText(stripHtml(blog.content), 120) || 'Read more about this topic...'}</p>
                            </div>
                            <div class="clearfix">
                                <div class="mt-post-readmore pull-left">
                                    <a href="${detailsLink}" title="READ MORE" rel="bookmark" class="site-button-secondry btn-effect">Read More<i class="fa fa-angle-right arrow-animation"></i></a>
                                </div>
                                <div class="widget_social_inks pull-right">
                                    <ul class="social-icons social-radius social-dark m-b0">
                                        <li><a href="https://www.facebook.com/" class="fa fa-facebook"></a></li>
                                        <li><a href="https://twitter.com/" class="fa fa-twitter"></a></li>
                                        <li><a href="https://rss.com/" class="fa fa-rss"></a></li>
                                        <li><a href="https://www.youtube.com/" class="fa fa-youtube"></a></li>
                                        <li><a href="https://in.linkedin.com/" class="fa fa-instagram"></a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="autor-post-tag-share bdr-t-1 bdr-solid bdr-gray p-t20"></div>
            </div>
        </div>`;
    }

    // Format blog date
    function formatBlogDate(dateString) {
        if (!dateString) {
            return { day: '01', month: 'Jan', year: '2024' };
        }
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Try parsing formatted date like "30 May 2024"
                const parts = dateString.split(' ');
                if (parts.length >= 3) {
                    return { day: parts[0], month: parts[1], year: parts[2] };
                }
                return { day: '01', month: 'Jan', year: '2024' };
            }
            
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return {
                day: String(date.getDate()).padStart(2, '0'),
                month: months[date.getMonth()],
                year: date.getFullYear()
            };
        } catch (e) {
            return { day: '01', month: 'Jan', year: '2024' };
        }
    }

    // Strip HTML tags from content
    function stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Truncate text to specified length
    function truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    }

    // Hide show more button
    function hideShowMoreButton() {
        const showMoreBtn = document.getElementById('show-more-blogs-btn');
        if (showMoreBtn) {
            showMoreBtn.style.display = 'none';
        }
    }

    // Apply Site Settings
    function applySiteSettings() {
        const settings = JSON.parse(localStorage.getItem('adaSiteSettings')) || {};
        
        // Apply Phone Numbers
        if (settings.phone1) {
            // Update all phone links and text
            document.querySelectorAll('a[href^="tel:"]').forEach((el, index) => {
                if (index === 0 && settings.phone1) {
                    el.href = 'tel:' + settings.phone1.replace(/[^0-9+]/g, '');
                    el.textContent = settings.phone1;
                } else if (index === 1 && settings.phone2) {
                    el.href = 'tel:' + settings.phone2.replace(/[^0-9+]/g, '');
                    el.textContent = settings.phone2;
                }
            });
            
            // Update phone text in contact sections
            document.querySelectorAll('.phone-number, [data-phone]').forEach((el, index) => {
                if (index === 0 && settings.phone1) el.textContent = settings.phone1;
                else if (index === 1 && settings.phone2) el.textContent = settings.phone2;
            });
        }
        
        // Apply Email
        if (settings.email1) {
            document.querySelectorAll('a[href^="mailto:"]').forEach((el, index) => {
                if (index === 0 && settings.email1) {
                    el.href = 'mailto:' + settings.email1;
                    if (!el.querySelector('i') && !el.querySelector('svg')) {
                        el.textContent = settings.email1;
                    }
                } else if (index === 1 && settings.email2) {
                    el.href = 'mailto:' + settings.email2;
                    if (!el.querySelector('i') && !el.querySelector('svg')) {
                        el.textContent = settings.email2;
                    }
                }
            });
        }
        
        // Apply Social Media Links
        const socialSelectors = {
            facebook: ['a.fa-facebook', 'a[href*="facebook.com"]', '.facebook a', 'a.facebook'],
            twitter: ['a.fa-twitter', 'a[href*="twitter.com"]', '.twitter a', 'a.twitter'],
            instagram: ['a.fa-instagram', 'a[href*="instagram.com"]', '.instagram a', 'a.instagram'],
            linkedin: ['a.fa-linkedin', 'a[href*="linkedin.com"]', '.linkedin a', 'a.linkedin'],
            youtube: ['a.fa-youtube', 'a[href*="youtube.com"]', '.youtube a', 'a.youtube']
        };
        
        Object.keys(socialSelectors).forEach(platform => {
            if (settings[platform]) {
                socialSelectors[platform].forEach(selector => {
                    document.querySelectorAll(selector).forEach(el => {
                        el.href = settings[platform];
                        el.target = '_blank';
                    });
                });
            }
        });
        
        // Apply WhatsApp
        if (settings.whatsapp) {
            const whatsappNumber = settings.whatsapp.replace(/[^0-9]/g, '');
            document.querySelectorAll('a[href*="whatsapp.com"], a[href*="wa.me"], #whatsapp-click').forEach(el => {
                el.href = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=Hi.. AD APPROVAL`;
            });
        }
        
        // Apply Company Name
        if (settings.company) {
            document.querySelectorAll('.company-name, [data-company]').forEach(el => {
                el.textContent = settings.company;
            });
        }
        
        // Apply Copyright Year
        if (settings.copyright) {
            document.querySelectorAll('.copyright-year, [data-copyright]').forEach(el => {
                el.textContent = settings.copyright;
            });
            // Also update footer copyright text
            document.querySelectorAll('.footer-bottom, .copy-right').forEach(el => {
                const text = el.innerHTML;
                const yearRegex = /©\s*\d{4}/g;
                el.innerHTML = text.replace(yearRegex, '© ' + settings.copyright);
            });
        }
        
        // Apply Address
        if (settings.address) {
            document.querySelectorAll('.address, [data-address], .contact-address').forEach(el => {
                el.textContent = settings.address;
            });
        }
    }

    // Contact Form Handler
    function initContactForm() {
        const forms = document.querySelectorAll('#contact-form, form[action*="contact"], .contact-form');
        forms.forEach(form => {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const formData = {
                    id: 'contact_' + Date.now(),
                    name: form.querySelector('[name="name"], [name="username"]')?.value || '',
                    email: form.querySelector('[name="email"]')?.value || '',
                    phone: form.querySelector('[name="phone"]')?.value || '',
                    subject: form.querySelector('[name="subject"]')?.value || '',
                    message: form.querySelector('[name="message"], textarea')?.value || '',
                    timestamp: new Date().toISOString(),
                    read: false
                };

                if (!formData.name || !formData.email || !formData.message) {
                    alert('Please fill in all required fields.');
                    return;
                }

                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(formData.email)) {
                    alert('Please enter a valid email address.');
                    return;
                }

                const contacts = JSON.parse(localStorage.getItem('adaContacts')) || [];
                contacts.unshift(formData);
                localStorage.setItem('adaContacts', JSON.stringify(contacts));

                // Log activity
                const activity = JSON.parse(localStorage.getItem('adaActivityLog')) || [];
                activity.unshift({
                    id: 'act_' + Date.now(),
                    type: 'contact',
                    action: 'new',
                    details: `New contact from ${formData.name}`,
                    userId: 'website',
                    username: 'Website',
                    timestamp: new Date().toISOString()
                });
                localStorage.setItem('adaActivityLog', JSON.stringify(activity.slice(0, 500)));

                form.reset();
                
                // Show success message
                const successMsg = document.createElement('div');
                successMsg.className = 'alert alert-success';
                successMsg.style.cssText = 'background:#d4edda;color:#155724;padding:15px;border-radius:5px;margin:15px 0;';
                successMsg.textContent = 'Thank you for your message! We will get back to you soon.';
                form.parentNode.insertBefore(successMsg, form);
                setTimeout(() => successMsg.remove(), 5000);
            });
        });
    }

    // Newsletter Subscription Handler
    function initNewsletterForm() {
        const forms = document.querySelectorAll('.newsletter-form, [data-newsletter], form[action*="newsletter"], .subscribe-form');
        const inputs = document.querySelectorAll('input[type="email"][placeholder*="newsletter" i], input[type="email"][placeholder*="subscribe" i], input[type="email"][placeholder*="email" i]');
        
        // Handle forms
        forms.forEach(form => {
            form.addEventListener('submit', handleNewsletterSubmit);
        });
        
        // Handle standalone email inputs with nearby buttons
        inputs.forEach(input => {
            const btn = input.parentElement.querySelector('button, input[type="submit"]');
            if (btn) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    subscribeEmail(input.value);
                    input.value = '';
                });
            }
        });
    }

    function handleNewsletterSubmit(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        subscribeEmail(emailInput?.value);
        if (emailInput) emailInput.value = '';
    }

    function subscribeEmail(email) {
        email = email?.trim();
        if (!email) {
            alert('Please enter your email address.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        const subscribers = JSON.parse(localStorage.getItem('adaSubscribers')) || [];
        
        if (subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
            alert('This email is already subscribed!');
            return;
        }

        subscribers.push({
            email: email,
            date: new Date().toISOString()
        });
        localStorage.setItem('adaSubscribers', JSON.stringify(subscribers));
        
        alert('Thank you for subscribing to our newsletter!');
    }

    // Track Blog View
    function trackBlogView() {
        const urlPath = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const blogId = urlParams.get('id');
        
        if (blogId || urlPath.includes('blog-details')) {
            const blogs = JSON.parse(localStorage.getItem('adaBlogPosts')) || [];
            let slug = urlPath.split('/').pop().replace('.html', '');
            
            const idx = blogs.findIndex(b => b.id === blogId || b.slug === slug);
            if (idx !== -1) {
                blogs[idx].viewCount = (blogs[idx].viewCount || 0) + 1;
                localStorage.setItem('adaBlogPosts', JSON.stringify(blogs));
            }
        }
    }

    // Add subtle Admin Link to Footer
    function addAdminLink() {
        const footer = document.querySelector('footer, .footer, .site-footer');
        if (!footer) return;

        const existingLink = footer.querySelector('.admin-login-link');
        if (existingLink) return;

        const container = footer.querySelector('.footer-bottom, .copyright, .copy-right') || footer;
        
        const adminLink = document.createElement('a');
        adminLink.href = 'admin/login.html';
        adminLink.className = 'admin-login-link';
        adminLink.textContent = 'Admin';
        adminLink.style.cssText = 'color: rgba(255,255,255,0.3); font-size: 11px; text-decoration: none; margin-left: 15px; transition: color 0.3s;';
        adminLink.onmouseover = function() { this.style.color = '#F5BF23'; };
        adminLink.onmouseout = function() { this.style.color = 'rgba(255,255,255,0.3)'; };
        
        container.appendChild(adminLink);
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        fixNavigationActive();
        applySiteSettings();
        initContactForm();
        initNewsletterForm();
        trackBlogView();
        addAdminLink();
        
        // Load blogs if on blog page
        if (document.getElementById('dynamic-blogs-container')) {
            loadBlogs();
        }
    });

    // Also apply settings after a short delay (for dynamically loaded content)
    setTimeout(function() {
        applySiteSettings();
        fixNavigationActive();
    }, 1000);

    // Expose functions globally
    window.AbuDhabiAdmin = {
        applySiteSettings: applySiteSettings,
        trackBlogView: trackBlogView,
        fixNavigationActive: fixNavigationActive,
        loadBlogs: loadBlogs,
        loadMoreBlogs: loadMoreBlogs,
        getSettings: function() { return JSON.parse(localStorage.getItem('adaSiteSettings')) || {}; },
        getBlogs: function() { return JSON.parse(localStorage.getItem('adaBlogPosts')) || []; },
        getServices: function() { return JSON.parse(localStorage.getItem('adaServices')) || []; }
    };

    // Make loadMoreBlogs available globally for onclick
    window.loadMoreBlogs = loadMoreBlogs;

})();
