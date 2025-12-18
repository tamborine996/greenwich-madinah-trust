/**
 * YouTube Integration for Greenwich Madinah Trust
 * Fetches latest videos and detects live streams
 * Opens videos in GLightbox modal
 */

(function() {
    'use strict';

    const CONFIG = {
        apiKey: 'AIzaSyBykCKsHXb2QntlNSEiWciBzHtf6LAmKrg',
        channelId: 'UCTlPBYKq48KKhrdn51A7F5w',
        maxVideos: 4,
        cacheKey: 'gmt_youtube_cache',
        cacheDuration: 5 * 60 * 1000, // 5 minutes

        // TEST MODE: Set to true to simulate a live stream
        // Remember to set back to false before going live!
        testLiveMode: false
    };

    // Spotlight config loaded from data/spotlight.json
    let spotlightConfig = null;

    // GLightbox instance (initialized once)
    let lightboxInstance = null;

    // Load spotlight configuration from JSON
    async function loadSpotlightConfig() {
        try {
            const response = await fetch('data/spotlight.json');
            if (!response.ok) throw new Error('Failed to load spotlight config');
            const data = await response.json();
            return data.videoSpotlight || null;
        } catch (error) {
            console.warn('Spotlight config not found, using latest video:', error);
            return null;
        }
    }

    // Check cache first to reduce API calls
    function getCache() {
        try {
            const cached = localStorage.getItem(CONFIG.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                if (Date.now() - data.timestamp < CONFIG.cacheDuration) {
                    return data;
                }
            }
        } catch (e) {
            console.warn('Cache read error:', e);
        }
        return null;
    }

    function setCache(data) {
        try {
            localStorage.setItem(CONFIG.cacheKey, JSON.stringify({
                ...data,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('Cache write error:', e);
        }
    }

    // Check if channel is currently live
    async function checkLiveStream() {
        // TEST MODE: Return fake live stream data
        if (CONFIG.testLiveMode) {
            console.log('🔴 TEST MODE: Simulating live stream');
            return {
                isLive: true,
                videoId: 'dQw4w9WgXcQ', // Sample video for testing
                title: 'LIVE: Gyarwee Shareef - Monthly Gathering (TEST MODE)',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
            };
        }

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CONFIG.channelId}&eventType=live&type=video&key=${CONFIG.apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Live check failed');
            const data = await response.json();

            if (data.items && data.items.length > 0) {
                return {
                    isLive: true,
                    videoId: data.items[0].id.videoId,
                    title: data.items[0].snippet.title,
                    thumbnail: data.items[0].snippet.thumbnails.high.url
                };
            }
        } catch (error) {
            console.warn('Live stream check error:', error);
        }

        return { isLive: false };
    }

    // Fetch latest videos from channel
    async function fetchLatestVideos() {
        // First get the uploads playlist ID
        const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CONFIG.channelId}&key=${CONFIG.apiKey}`;

        try {
            const channelResponse = await fetch(channelUrl);
            if (!channelResponse.ok) throw new Error('Channel fetch failed');
            const channelData = await channelResponse.json();

            if (!channelData.items || channelData.items.length === 0) {
                throw new Error('Channel not found');
            }

            const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

            // Now fetch videos from uploads playlist
            const videosUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${CONFIG.maxVideos}&key=${CONFIG.apiKey}`;

            const videosResponse = await fetch(videosUrl);
            if (!videosResponse.ok) throw new Error('Videos fetch failed');
            const videosData = await videosResponse.json();

            return videosData.items.map(item => ({
                videoId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
                publishedAt: item.snippet.publishedAt
            }));

        } catch (error) {
            console.error('Error fetching videos:', error);
            return [];
        }
    }

    // Initialize GLightbox and return open function
    function initLightbox() {
        // Check if GLightbox is available
        if (typeof GLightbox === 'undefined') {
            console.warn('GLightbox not loaded, video modals will not work');
            return () => {};
        }

        // Return a function that opens GLightbox with a specific video
        function openLightbox(videoId, title) {
            // Create a temporary GLightbox instance for this video
            const tempLightbox = GLightbox({
                elements: [{
                    href: `https://www.youtube.com/watch?v=${videoId}`,
                    type: 'video',
                    title: title,
                    source: 'youtube',
                    width: 900
                }],
                autoplayVideos: true,
                plyr: {
                    config: {
                        youtube: {
                            rel: 0,
                            showinfo: 0,
                            modestbranding: 1
                        }
                    }
                }
            });
            tempLightbox.open();
        }

        return openLightbox;
    }

    // Populate the carousel slide with spotlight or latest video
    function populateCarouselSlide(videos, spotlightCfg, openLightbox) {
        const slide = document.getElementById('carousel-youtube-slide');
        if (!slide) return;

        let spotlightVideo;

        // Use spotlight config from JSON if enabled
        if (spotlightCfg && spotlightCfg.enabled && spotlightCfg.videoId) {
            spotlightVideo = {
                videoId: spotlightCfg.videoId,
                title: spotlightCfg.title || 'Watch Video',
                // Use maxresdefault for highest quality
                thumbnail: `https://img.youtube.com/vi/${spotlightCfg.videoId}/maxresdefault.jpg`
            };
        } else if (videos.length > 0) {
            // Fall back to latest video
            spotlightVideo = videos[0];
        } else {
            return; // No video to show
        }

        const thumbImg = document.getElementById('youtube-slide-thumb');
        const titleEl = document.getElementById('youtube-slide-title');
        const playBtn = document.getElementById('youtube-slide-btn');
        const thumbWrapper = slide.querySelector('.youtube-slide-thumb-wrapper');

        // Populate content
        thumbImg.src = spotlightVideo.thumbnail;
        thumbImg.alt = spotlightVideo.title;
        titleEl.textContent = spotlightVideo.title;

        // Show the slide
        slide.style.display = '';

        // Tell Swiper to recalculate (needed because slide was initially hidden)
        // With loop mode and fade effect, Swiper needs to know about the new slide
        if (window.heroSwiper) {
            window.heroSwiper.update();
        }

        // Click handler for thumbnail wrapper and play button
        const openVideo = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(spotlightVideo.videoId, spotlightVideo.title);
        };

        // Make thumbnail wrapper clickable
        if (thumbWrapper) {
            thumbWrapper.addEventListener('click', openVideo);
        }
        if (playBtn) {
            playBtn.addEventListener('click', openVideo);
        }
    }

    // Render the YouTube section
    function renderYouTubeSection(videos, liveStream, openLightbox) {
        const section = document.getElementById('youtube-section');
        if (!section) return;

        const container = section.querySelector('.youtube-videos-grid');
        const liveContainer = section.querySelector('.youtube-live-container');

        if (!container) return;

        // Handle live stream
        if (liveStream.isLive && liveContainer) {
            liveContainer.innerHTML = `
                <div class="live-stream-card">
                    <div class="live-badge">
                        <span class="live-dot"></span>
                        LIVE NOW
                    </div>
                    <button type="button" class="live-stream-link" data-video-id="${liveStream.videoId}" data-title="${liveStream.title}">
                        <div class="live-thumbnail">
                            <img src="${liveStream.thumbnail}" alt="${liveStream.title}">
                            <div class="live-play-overlay">
                                <svg viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                        </div>
                        <h3 class="live-title">${liveStream.title}</h3>
                    </button>
                </div>
            `;
            liveContainer.style.display = 'block';

            // Add click handler for live stream
            const liveBtn = liveContainer.querySelector('.live-stream-link');
            liveBtn.addEventListener('click', () => {
                openLightbox(liveStream.videoId, liveStream.title);
            });
        } else if (liveContainer) {
            liveContainer.style.display = 'none';
        }

        // Render video grid
        if (videos.length === 0) {
            container.innerHTML = '<p class="youtube-error">Unable to load videos. Please visit our YouTube channel directly.</p>';
            return;
        }

        container.innerHTML = videos.map(video => `
            <button type="button" class="youtube-video-card" data-video-id="${video.videoId}" data-title="${video.title}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="video-play-icon">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
                <h4 class="video-title">${video.title}</h4>
            </button>
        `).join('');

        // Add click handlers for video cards
        container.querySelectorAll('.youtube-video-card').forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.dataset.videoId;
                const title = card.dataset.title;
                openLightbox(videoId, title);
            });
        });

        // Show the section
        section.style.display = 'block';
    }

    // Main initialization
    async function init() {
        const section = document.getElementById('youtube-section');
        if (!section) return;

        // Initialize lightbox
        const openLightbox = initLightbox();

        // Load spotlight config from JSON
        const spotlightCfg = await loadSpotlightConfig();

        // ALWAYS check live status fresh - never rely on cache for this
        // Users need to see live streams immediately, not wait for cache expiry
        const liveStream = await checkLiveStream();

        // Videos can be cached (they don't change often)
        const cached = getCache();
        let videos;

        if (cached && cached.videos) {
            videos = cached.videos;
        } else {
            videos = await fetchLatestVideos();
            // Only cache videos, not live status
            setCache({ videos });
        }

        // Render YouTube section and carousel slide
        renderYouTubeSection(videos, liveStream, openLightbox);
        populateCarouselSlide(videos, spotlightCfg, openLightbox);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
