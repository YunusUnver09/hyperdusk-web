import React from 'react';
import { Zap, Activity, Globe, Shield, Terminal } from 'lucide-react';

export const StudioAboutSection: React.FC = () => {
  const pillars = [
    {
      icon: <Zap size={24} color="#00f3ff" />,
      title: 'Saf 60 FPS Canvas Mühendisliği',
      desc: 'Hantal motor paketleri yerine saf HTML5 Canvas ve donanım hızlandırmalı GPU kompozitleme kullanarak saniyede 60 kare sabit performans sunuyoruz.'
    },
    {
      icon: <Activity size={24} color="#a855f7" />,
      title: 'Sıfır Gecikmeli Web Audio Motoru',
      desc: 'Düşük gecikmeli Web Audio API altyapısı sayesinde her lazer atışı, kombo patlaması ve boss darbesi milisaniyelik hassasiyetle duyulur.'
    },
    {
      icon: <Globe size={24} color="#00ff88" />,
      title: 'Tek Kod Tabanı, Tüm Cihazlar',
      desc: 'Web tarayıcılarından mobil Expo WebView uygulamalarına kadar tek bir optimize edilmiş motorla anında başlatılabilir hibrit yapı.'
    },
    {
      icon: <Shield size={24} color="#ffd000" />,
      title: 'Arcade Saflığında Oynanış',
      desc: 'Kolay öğrenilen fakat ustalaşması derin taktiksel katmanlar barındıran; beklemesiz, reklamsız ve akıcı saf arcade eğlencesi.'
    }
  ];

  return (
    <section id="about" className="studio-section about-section">
      <div className="section-header-wrap">
        <div className="section-tag-badge cyan">
          <Terminal size={14} />
          <span>MİMARİ & VİZYON</span>
        </div>
        <h2 className="section-title">
          HYPERDUSK: <span className="title-highlight cyan">YENİ NESİL OYUN GELİŞTİRME</span>
        </h2>
        <p className="section-desc">
          Oyun oynamak için dakikalarca yükleme ekranı beklemeye gerek yok. Modern web teknolojilerinin sınırlarını zorlayarak
          anında açılan, yüksek tempolu ve görsel olarak büyüleyici deneyimler üretiyoruz.
        </p>
      </div>

      <div className="about-pillars-grid">
        {pillars.map((item, idx) => (
          <div key={idx} className="about-pillar-card">
            <div className="pillar-icon-box">
              {item.icon}
            </div>
            <h3 className="pillar-title">{item.title}</h3>
            <p className="pillar-desc">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Technology Spec Bar */}
      <div className="studio-tech-strip">
        <div className="tech-item">
          <span className="tech-label">RENDER ENGINE</span>
          <span className="tech-val">Custom 2D HTML5 Canvas</span>
        </div>
        <div className="tech-divider" />
        <div className="tech-item">
          <span className="tech-label">AUDIO STACK</span>
          <span className="tech-val">Web Audio API + Dynamic BGM</span>
        </div>
        <div className="tech-divider" />
        <div className="tech-item">
          <span className="tech-label">FRAMEWORK</span>
          <span className="tech-val">React 19 + TypeScript + Vite</span>
        </div>
        <div className="tech-divider" />
        <div className="tech-item">
          <span className="tech-label">MOBILE READY</span>
          <span className="tech-val">Expo Native + PWA</span>
        </div>
      </div>
    </section>
  );
};
