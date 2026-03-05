/* ==========================================
   Spreadsheet連携機能 (CMS) 設定
   ========================================== */
const CMS_API_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxx/exec'; // ★ここを書き換え（元のスプレッドシート用）

// お知らせ(NEWS) JSONの取得元URL
const NEWS_JSON_URL = 'https://kbperk.github.io/news-info/newsData.json';

document.addEventListener('DOMContentLoaded', () => {
    const minLoadingTime = 1500;
    const startTime = Date.now();

    // 1. 既存のCMS（スプレッドシート）データのフェッチ
    let fetchSitePromise = Promise.resolve();
    if(CMS_API_URL.includes('script.google.com')) {
        fetchSitePromise = fetchSiteData();
    }

    // 2. 今回追加したお知らせ(NEWS)データのフェッチ
    let fetchNewsPromise = fetchNewsData();

    // 両方のデータ取得とローディングの最低時間を待ってから画面を開く
    Promise.all([
        fetchSitePromise,
        fetchNewsPromise,
        new Promise(resolve => setTimeout(resolve, minLoadingTime))
    ]).then(() => {
        document.body.classList.add('loaded');
        
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline();
            
            tl.to("#loader_char", {
                rotation: 360,
                scale: 1.5,
                duration: 0.5,
                ease: "back.in(1.7)"
            })
            .to("#loader", {
                yPercent: -100,
                duration: 0.8,
                ease: "none",
                onComplete: () => {
                    const loaderEl = document.getElementById('loader');
                    if(loaderEl) loaderEl.style.display = 'none';
                }
            })
            
            .set("#img_hero", { visibility: "visible" })
            .fromTo("#img_hero", 
                { scale: 4, autoAlpha: 0, y: -300 }, 
                { scale: 1, autoAlpha: 1, y: 0, duration: 1.5, ease: "bounce.out" }, 
                "-=0.2" 
            )
            
            .set("#kb_stamp", { visibility: "visible", transformOrigin: "center center" })
            .fromTo("#kb_stamp",
                { scale: 8, autoAlpha: 0 }, 
                { scale: 1, autoAlpha: 1, duration: 0.2, ease: "power4.in" } 
            )
            
            .to("main", {
                x: () => gsap.utils.random(-15, 15),
                y: () => gsap.utils.random(-15, 15),
                duration: 0.05,
                repeat: 5,
                yoyo: true,
                ease: "none"
            })
            .set("main", { x: 0, y: 0 }) 
            
            .fromTo("#text_hero_title_1", 
                { y: 50, opacity: 0, autoAlpha: 0 }, 
                { y: 0, opacity: 1, autoAlpha: 1, duration: 0.8, ease: "back.out(1.7)" }, 
                "+=0.2"
            )
            .fromTo("#text_hero_title_2", 
                { y: 50, opacity: 0, autoAlpha: 0, scale: 0.5 }, 
                { y: 0, opacity: 1, autoAlpha: 1, scale: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" }, 
                "-=0.6"
            );
        }
        
        setTimeout(() => {
            initScrollAnimations();
            initDancingText(); 
        }, 500);
    });

    initNavbar();
    
    // ハンバーガーメニュー制御
    const hamburgerBtn = document.getElementById('hamburger_btn');
    const mobileMenu = document.getElementById('mobile_menu');
    const menuLinks = document.querySelectorAll('.menu-link');
    let isMenuOpen = false;

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
                mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
                hamburgerBtn.innerHTML = `<svg class="w-8 h-8 pointer-events-none text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"></path></svg>`;
            } else {
                mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
                mobileMenu.classList.add('opacity-0', 'pointer-events-none');
                hamburgerBtn.innerHTML = `<svg class="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 6h16M4 12h16M4 18h16"></path></svg>`;
            }
        });

        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                isMenuOpen = false;
                mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
                mobileMenu.classList.add('opacity-0', 'pointer-events-none');
                hamburgerBtn.innerHTML = `<svg class="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M4 6h16M4 12h16M4 18h16"></path></svg>`;
            });
        });
    }

    // スムーズなスクロールのためのCSSを自動追加
    if (!document.getElementById('swiper-linear-style')) {
        const style = document.createElement('style');
        style.id = 'swiper-linear-style';
        style.innerHTML = `
            .newsSwiper .swiper-wrapper {
                transition-timing-function: linear !important;
            }
        `;
        document.head.appendChild(style);
    }
});

// --- ▼ お知らせ(NEWS)データのフェッチとUI構築 ▼ ---
async function fetchNewsData() {
    try {
        const res = await fetch(NEWS_JSON_URL + '?v=' + new Date().getTime());
        if(res.ok) {
            const data = await res.json();
            renderNewsSection(data);
        }
    } catch(e) {
        console.error('News data loading failed.', e);
    }
}

// YouTubeを「音声なし」「自動再生」「ループ」の背景動画化する
function getSafeEmbedUrl(url) {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        const vid = match[2];
        return `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&playsinline=1&loop=1&playlist=${vid}&controls=0&rel=0&showinfo=0`;
    }
    return url; 
}

function renderNewsSection(data) {
    const marqueeWrapper = document.getElementById('marquee-wrapper');
    const marqueeText = document.getElementById('text_news_marquee');
    if (data.marquee && data.marquee.is_public && data.marquee.text) {
        marqueeText.innerHTML = `<span>${data.marquee.text}</span>`;
        marqueeWrapper.style.display = 'flex';
    } else {
        marqueeWrapper.style.display = 'none';
    }

    const sliderWrapper = document.getElementById('slider-wrapper');
    const sliderTrack = document.getElementById('news-slider-track');
    
    const publicItems = (data.items || []).filter(item => {
        return item.is_public && (item.image || item.youtube_url);
    });
    
    if (publicItems.length > 0) {
        sliderWrapper.style.display = 'block';
        
        // ★ 修正: どのデバイスでも「完全に左右画面いっぱい」に広げる最強の指定
        if (sliderWrapper.parentElement) {
            const parent = sliderWrapper.parentElement;
            
            // クラスを一旦リセットして再構築
            parent.className = ''; 
            
            // 共通のglass-panelクラスを付与し、上下の余白を設定
            parent.classList.add('glass-panel', 'py-6', 'md:py-10', 'shadow-2xl', 'mt-8', 'mb-12');
            
            // 画面幅100vwに強制拡張し、中央にピタッと合わせる魔法のコード
            parent.style.width = '100vw';
            parent.style.maxWidth = '100vw';
            parent.style.marginLeft = 'calc(50% - 50vw)';
            parent.style.marginRight = 'calc(50% - 50vw)';
            parent.style.boxSizing = 'border-box';
        }

        let html = '';
        const isSingle = publicItems.length === 1;
        const displayItems = [...publicItems];
        
        displayItems.forEach(item => {
            let mediaHtml = '';
            if (item.youtube_url) {
                const safeUrl = getSafeEmbedUrl(item.youtube_url);
                // ★ 修正: 動画の上に透明なシールドを張り、タッチイベントを完全に遮断（動画上で止まる問題を解決）
                mediaHtml = `
                    <div class="absolute inset-0 w-full h-full pointer-events-none">
                        <iframe src="${safeUrl}" class="w-full h-full border-0 pointer-events-none" frameborder="0" allow="autoplay; muted; fullscreen; picture-in-picture" allowfullscreen></iframe>
                    </div>
                    <div class="absolute inset-0 z-20 w-full h-full bg-transparent"></div>
                `;
            } else if (item.image) {
                mediaHtml = `<img src="${item.image}" class="absolute inset-0 w-full h-full object-contain">`;
            }
            
            html += `
                <div class="swiper-slide bg-black flex flex-col h-auto border-y-[6px] md:border-y-8 border-pop-green box-border overflow-hidden" style="transform: translateZ(0);">
                    <div class="py-2 md:py-3 text-center bg-white relative z-10 shadow-sm">
                        <h3 class="font-bold text-gray-800 text-sm md:text-lg leading-snug tracking-wider">${item.title || "お知らせ"}</h3>
                    </div>
                    <div class="relative w-full h-[40vh] md:h-[55vh] bg-black flex items-center justify-center"> 
                        ${mediaHtml}
                    </div>
                </div>
            `;
        });

        // ★ 追加: YouTubeエラーを回避しつつドラム式を擬似再現するための「安全なダミー（分身）」
        // 1枚目の要素を最後にもう一度配置し、それに到達した瞬間に0秒で1枚目にワープ（すり替え）させます。
        if (!isSingle && displayItems.length > 0) {
            const firstItem = displayItems[0];
            let dummyMediaHtml = '';
            if (firstItem.image) {
                dummyMediaHtml = `<img src="${firstItem.image}" class="absolute inset-0 w-full h-full object-contain">`;
            } else {
                // 1枚目が動画の場合、ここでiframeを複製するとエラーになるため、黒背景のダミーを置く
                dummyMediaHtml = `<div class="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center text-white font-bold tracking-widest text-xl">▶ NOW PLAYING...</div>`;
            }
            
            html += `
                <div class="swiper-slide bg-black flex flex-col h-auto border-y-[6px] md:border-y-8 border-pop-green box-border overflow-hidden" style="transform: translateZ(0);">
                    <div class="py-2 md:py-3 text-center bg-white relative z-10 shadow-sm">
                        <h3 class="font-bold text-gray-800 text-sm md:text-lg leading-snug tracking-wider">${firstItem.title || "お知らせ"}</h3>
                    </div>
                    <div class="relative w-full h-[40vh] md:h-[55vh] bg-black flex items-center justify-center"> 
                        ${dummyMediaHtml}
                    </div>
                </div>
            `;
        }
        
        sliderTrack.innerHTML = html;

        if (typeof Swiper !== 'undefined') {
            const newsSwiper = new Swiper(".newsSwiper", {
                loop: false, // ★ 修正: Swiperの標準ループは絶対に使わない（YouTubeエラーの元凶）
                speed: 12000, 
                autoplay: isSingle ? false : {
                    delay: 0,
                    disableOnInteraction: false, 
                },
                slidesPerView: isSingle ? 1 : 1.15, 
                centeredSlides: true, 
                spaceBetween: 0, 
                allowTouchMove: true,
                pagination: {
                    el: ".swiper-pagination",
                    clickable: true,
                },
                breakpoints: {
                    768: {
                        slidesPerView: isSingle ? 1 : 1.5, 
                        centeredSlides: true,
                        spaceBetween: 0,
                    }
                },
                on: {
                    // ★ 自作の「すり替え」処理でドラム式を再現
                    slideChange: function () {
                        // 現在アクティブなのが「自作のダミースライド（一番最後）」になったら
                        if (this.activeIndex === displayItems.length) {
                            // アニメーションなし（0ミリ秒）で本物の1枚目にワープ！
                            this.slideTo(0, 0);
                        }
                    }
                }
            });

            // タップ（クリック）し続けている間だけ止まる仕掛け
            if (!isSingle) {
                const swiperArea = document.querySelector('.newsSwiper');
                if (swiperArea) {
                    swiperArea.addEventListener('touchstart', () => newsSwiper.autoplay.stop(), {passive: true});
                    swiperArea.addEventListener('touchend', () => newsSwiper.autoplay.start(), {passive: true});
                    swiperArea.addEventListener('mousedown', () => newsSwiper.autoplay.stop());
                    swiperArea.addEventListener('mouseup', () => newsSwiper.autoplay.start());
                    swiperArea.addEventListener('mouseleave', () => newsSwiper.autoplay.start());
                }
            }
        }
    } else {
        sliderWrapper.style.display = 'none'; 
        if (sliderWrapper.parentElement) {
            sliderWrapper.parentElement.style.display = 'none';
        }
    }
}
// --- ▲ お知らせデータのフェッチ処理 ここまで ▲ ---


// --- 既存のスクロールアニメーション等の初期化 ---
function initScrollAnimations() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        gsap.set('.js-scroll', { visibility: 'visible' });

        gsap.to('.gs-float', {
            y: "random(-20, 20)",
            x: "random(-10, 10)",
            rotation: "random(-15, 15)",
            duration: "random(2, 4)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });

        gsap.utils.toArray('.js-scroll.fade-up, .js-scroll.slide-up').forEach(target => {
            gsap.fromTo(target, 
                { y: 50, autoAlpha: 0 }, 
                { y: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: target, start: "top 85%" }}
            );
        });

        gsap.utils.toArray('.js-scroll.slide-left').forEach(target => {
            gsap.fromTo(target, 
                { x: -50, autoAlpha: 0 }, 
                { x: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: target, start: "top 85%" }}
            );
        });

        gsap.utils.toArray('.js-scroll.slide-right').forEach(target => {
            gsap.fromTo(target, 
                { x: 50, autoAlpha: 0 }, 
                { x: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: target, start: "top 85%" }}
            );
        });

        gsap.utils.toArray('.js-scroll.elastic-pop').forEach(target => {
            gsap.fromTo(target, 
                { scale: 0.8, autoAlpha: 0 }, 
                { scale: 1, autoAlpha: 1, duration: 1, ease: "elastic.out(1, 0.5)", scrollTrigger: { trigger: target, start: "top 85%" }}
            );
        });

    } else {
        const targets = document.querySelectorAll('.js-scroll');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-active');
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -100px 0px', threshold: 0.1 });
        targets.forEach(target => observer.observe(target));
    }
}

function initDancingText() {
    const textElements = document.querySelectorAll('.dancing-text');
    textElements.forEach(el => {
        const text = el.getAttribute('data-cms-text') || el.innerText;
        el.innerHTML = ''; 
        [...text].forEach((char, index) => {
            const span = document.createElement('span');
            span.innerText = char === ' ' ? '\u00A0' : char; 
            span.classList.add('dancing-char');
            span.style.animationDelay = `${index * 0.1}s`;
            span.classList.add('animate-wave'); 
            el.appendChild(span);
        });
    });
}

function initNavbar() {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('py-1', 'shadow-xl'); nav.classList.remove('py-2');
        } else {
            nav.classList.remove('py-1', 'shadow-xl'); nav.classList.add('py-2');
        }
    });
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                     top: offsetPosition,
                     behavior: "smooth"
                });
            }
        });
    });
}

async function fetchSiteData() {
    try {
        const response = await fetch(CMS_API_URL);
        const json = await response.json();
        
        if (json.status === 'success' && json.data) {
            applySiteData(json.data);
            console.log('CMS Updated!');
        }
    } catch (error) {
        console.error('CMS Error:', error);
    }
}

function applySiteData(dataMap) {
    Object.keys(dataMap).forEach(key => {
        
        if (key === 'gallery' && Array.isArray(dataMap[key])) {
            const container = document.getElementById('gallery_container');
            const section = document.getElementById('gallery_section');
            if (container && section) {
                container.innerHTML = ''; 
                
                if(dataMap[key].length > 0) {
                    section.classList.remove('hidden'); 
                    
                    dataMap[key].forEach((item, index) => {
                        const delay = index * 100;
                        const cardHTML = `
                            <div class="js-scroll fade-up area-card-3d group" style="transition-delay: ${delay}ms;">
                                <div class="card-inner glass-panel-light rounded-[2rem] shadow-2xl overflow-hidden border-b-8 border-pop-green">
                                    <div class="img-box h-64 overflow-hidden relative bg-white/30">
                                        ${item.tag ? `<span class="absolute top-4 left-4 bg-pop-green text-white font-bold px-4 py-1 rounded-full z-20 shadow-lg">${item.tag}</span>` : ''}
                                        <div class="absolute inset-0 bg-cover bg-center blur-xl scale-125 opacity-60 transition duration-700" style="background-image: url('${item.imageUrl}');"></div>
                                        <img src="${item.imageUrl}" class="relative z-10 w-full h-full object-cover transition duration-700 group-hover:scale-105" alt="Gallery Image">
                                    </div>
                                    <div class="p-8 text-center relative z-20 bg-white/40 backdrop-blur-sm">
                                        <h3 class="text-2xl font-bold text-pop-green mb-3 mt-4">${item.title || ''}</h3>
                                        <p class="text-gray-700 font-bold">${item.description || ''}</p>
                                    </div>
                                </div>
                            </div>
                        `;
                        container.insertAdjacentHTML('beforeend', cardHTML);
                    });
                    
                    if (typeof ScrollTrigger !== 'undefined') {
                        ScrollTrigger.refresh();
                    }
                }
            }
            return; 
        }

        const element = document.getElementById(key);
        if (!element) return;

        const info = dataMap[key];

        if (info.text) {
            element.innerHTML = info.text;
            element.setAttribute('data-cms-text', info.text);
            adjustFontSizeToFit(element);
        }

        element.classList.forEach(cls => {
            if (cls.startsWith('cms-style-') || cls.startsWith('cms-anim-')) {
                element.classList.remove(cls);
            }
        });

        if (info.style) element.classList.add(`cms-style-${info.style}`);
        if (info.anim) element.classList.add(`cms-anim-${info.anim}`);

        element.style.color = info.color ? info.color : '';
        if (info.size) {
            element.style.fontSize = `${info.size}%`;
        }
    });
}

function adjustFontSizeToFit(element) {
    let fontSize = parseFloat(window.getComputedStyle(element).fontSize);
    const minSize = 8; 
    
    let safety = 0;
    
    while (element.scrollWidth > element.clientWidth && fontSize > minSize && safety < 100) {
        fontSize -= 1;
        element.style.fontSize = fontSize + 'px';
        safety++;
    }
}