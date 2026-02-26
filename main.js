/* ==========================================
   Spreadsheet連携機能 (CMS) 設定
   ========================================== */
const CMS_API_URL = 'https://script.google.com/macros/s/xxxxxxxxxxxxxxxxx/exec'; // ★ここを書き換え

document.addEventListener('DOMContentLoaded', () => {
    // 1. ローディング演出 & データ取得
    // 最低でも1.5秒はローディングを見せて、ワクワクさせる
    const minLoadingTime = 1500;
    const startTime = Date.now();

    // 並行してデータ取得開始
    let fetchPromise = Promise.resolve();
    if(CMS_API_URL.includes('script.google.com')) {
        fetchPromise = fetchSiteData();
    }

    // 演出時間とデータ取得の両方が終わったら画面を開く
    Promise.all([
        fetchPromise,
        new Promise(resolve => setTimeout(resolve, minLoadingTime))
    ]).then(() => {
        document.body.classList.add('loaded'); // カーテンを開ける
        
        // ★ローディング明けのアニメーション
        if (typeof gsap !== 'undefined') {
            const tl = gsap.timeline();
            
            // kb君が回転して消える
            tl.to("#loader_char", {
                rotation: 360,
                scale: 1.5,
                duration: 0.5,
                ease: "back.in(1.7)"
            })
            .to("#loader", {
                yPercent: -100,
                duration: 0.8,
                ease: "power4.inOut"
            })
            
            // 1. ヒーロー画像が手前上空からドーンと降ってきてバウンド着地
            .set("#img_hero", { visibility: "visible" })
            .fromTo("#img_hero", 
                { scale: 4, autoAlpha: 0, y: -300 }, 
                { scale: 1, autoAlpha: 1, y: 0, duration: 1.5, ease: "bounce.out" }, 
                "-=0.2" 
            )
            
            // 2. 右下のKBハンコが巨大な状態からドカン！と叩きつけられる
            .set("#kb_stamp", { visibility: "visible", transformOrigin: "center center" })
            .fromTo("#kb_stamp",
                { scale: 8, autoAlpha: 0 }, 
                { scale: 1, autoAlpha: 1, duration: 0.2, ease: "power4.in" } 
            )
            
            // 3. 叩きつけられた瞬間に画面全体をブルブルっと揺らす
            // 【重要修正】bodyを揺らすと「ご予約はこちら」のfixedが解除されて消えてしまうため、mainタグを揺らします
            .to("main", {
                x: () => gsap.utils.random(-15, 15),
                y: () => gsap.utils.random(-15, 15),
                duration: 0.05,
                repeat: 5,
                yoyo: true,
                ease: "none"
            })
            .set("main", { x: 0, y: 0 }) 
            
            // 4. その後、いつものタイトル文字が踊りながら登場
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
        
        // アニメーション初期化
        setTimeout(() => {
            initScrollAnimations();
            initDancingText(); 
        }, 500);
    });

    initNavbar();
});

/* --- 1. スクロールアニメーション --- */
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

/* --- 2. 踊る文字 (Dancing Text) --- */
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

/* --- 3. ナビゲーション (スムーススクロール対応) --- */
function initNavbar() {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('py-2', 'shadow-xl'); nav.classList.remove('py-3');
        } else {
            nav.classList.remove('py-2', 'shadow-xl'); nav.classList.add('py-3');
        }
    });
    
    // ナビゲーションのリンク先へスムースに飛ぶ機能
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

/* --- 4. CMSデータ反映 (自動縮小 & ギャラリー動的生成付き) --- */
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
        
        // ギャラリー配列データが届いた場合の特別処理
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

        // 1. テキスト反映 & 自動縮小
        if (info.text) {
            element.innerHTML = info.text;
            element.setAttribute('data-cms-text', info.text);
            adjustFontSizeToFit(element);
        }

        // 2. クラスリセット
        element.classList.forEach(cls => {
            if (cls.startsWith('cms-style-') || cls.startsWith('cms-anim-')) {
                element.classList.remove(cls);
            }
        });

        // 3. スタイル & アニメーション
        if (info.style) element.classList.add(`cms-style-${info.style}`);
        if (info.anim) element.classList.add(`cms-anim-${info.anim}`);

        // 4. 色 & サイズ
        element.style.color = info.color ? info.color : '';
        if (info.size) {
            element.style.fontSize = `${info.size}%`;
        }
    });
}

/**
 * 要素の幅からはみ出している場合、フォントサイズを小さくする関数 (米粒化許容)
 */
function adjustFontSizeToFit(element) {
    let fontSize = parseFloat(window.getComputedStyle(element).fontSize);
    const minSize = 8; 
    
    // 安全装置: 100回以上のループはさせない
    let safety = 0;
    
    while (element.scrollWidth > element.clientWidth && fontSize > minSize && safety < 100) {
        fontSize -= 1;
        element.style.fontSize = fontSize + 'px';
        safety++;
    }
}