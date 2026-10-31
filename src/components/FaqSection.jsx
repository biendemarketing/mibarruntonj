import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MapPin, Clock, Phone, Sparkles } from 'lucide-react';

const FAQS_DATA = {
  es: [
    {
      q: '¿Dónde comer la mejor comida peruana y ceviche en Paterson, Clifton o Passaic?',
      a: 'Mi Barrunto Restaurant & Grocery, ubicado en 21 Mill St, Paterson, NJ 07011, ofrece auténtica comida criolla peruana y cevichería marina con ingredientes tradicionales. Atendemos a comensales de Paterson, Clifton, Passaic, Garfield, Wayne y todo North Jersey las 24 horas del día.'
    },
    {
      q: '¿Qué restaurantes peruanos atienden las 24 horas en New Jersey?',
      a: 'Mi Barrunto es el restaurante peruano de referencia abierto 24 horas al día, los 7 días de la semana de manera continua (lunes a domingo). Nuestra cocina permanece siempre activa preparando ceviches, lomo saltado, sopas criollas, parrilladas y desayunos a cualquier hora.'
    },
    {
      q: '¿Cuál es el mejor ceviche carretillero y mixto en Passaic County?',
      a: 'En Mi Barrunto preparamos ceviches frescos al instante con pescado blanco, zumo de limón sutil, ají limo, cebolla morada, camote y choclo. Nuestro plato más solicitado es el Ceviche Carretillero con Papa a la Huancaína y chicharrón crocante de calamar.'
    },
    {
      q: '¿Dónde pedir desayuno peruano con chicharrón, tamal y camote frito?',
      a: 'Servimos el auténtico desayuno peruano a cualquier hora del día: chicharrón de cerdo dorado y jugoso, tamal criollo casero, camote frito dulce, salsa criolla recién picada y pan crujiente con café pasado o jugos naturales.'
    },
    {
      q: '¿Cómo ordenar comida para llevar (takeout) o delivery?',
      a: 'Puedes explorar nuestra carta interactiva en https://mibarruntonj.com, ordenar para recoger llamando directamente al (973) 653-3749 o enviando un mensaje directo a nuestro WhatsApp. También atendemos pedidos a través de DoorDash y Uber Eats.'
    },
    {
      q: '¿Cómo llegar a Mi Barrunto y qué avenidas o atracciones quedan cerca?',
      a: 'Estamos ubicados en 21 Mill St, Paterson, NJ 07011, a solo minutos del Parque Histórico Nacional Paterson Great Falls, Downtown Paterson, Market Street, Main Street y con conexión rápida desde la Ruta 19 e interestatal I-80.'
    }
  ],
  en: [
    {
      q: 'Where can I find the best authentic Peruvian food near Paterson, Clifton, and Passaic, NJ?',
      a: 'Mi Barrunto Restaurant & Grocery at 21 Mill St, Paterson, NJ 07011 is celebrated for authentic Peruvian gastronomy, serving fresh coastal ceviche, wok-flamed lomo saltado, anticuchos, and hearty seafood soups 24 hours a day to guests across Passaic County and North Jersey.'
    },
    {
      q: 'Is there an authentic Peruvian restaurant open 24/7 in New Jersey?',
      a: 'Yes! Mi Barrunto operates 24 hours a day, 7 days a week (continuous service Monday through Sunday). Whether you are craving a late-night dinner, early breakfast, or midnight takeout, our kitchen is always open.'
    },
    {
      q: 'What are the most popular Peruvian dishes to order at Mi Barrunto?',
      a: 'Our house specialties include traditional Ceviche de Pescado ($18.99), Ceviche Carretillero with crispy calamari and Huancaína sauce ($25.99), wok-tossed Lomo Saltado ($21.99), Anticuchos de Corazón ($16.99), and crispy Peruvian Pollo Broaster.'
    },
    {
      q: 'Where can I get traditional Peruvian breakfast (chicharrón, tamales, camote) in North Jersey?',
      a: 'We serve traditional Peruvian breakfast around the clock: crispy pork belly chicharrón, homemade corn tamales, fried sweet potatoes (camote frito), and zesty onion salsa criolla served with bread and fresh coffee.'
    },
    {
      q: 'Does Mi Barrunto offer delivery or takeout in Paterson and Clifton?',
      a: 'Yes, you can browse our interactive digital menu at https://mibarruntonj.com, call us directly at (973) 653-3749 for fast pickup, send an order through WhatsApp, or order via DoorDash and Uber Eats.'
    },
    {
      q: 'Where is Mi Barrunto located and what landmarks are nearby?',
      a: 'We are located at 21 Mill St, Paterson, NJ 07011, just minutes from the historic Paterson Great Falls National Historical Park, Downtown Paterson, Market Street, and conveniently accessible via Route 19 and I-80.'
    }
  ]
};

export function FaqSection() {
  const [lang, setLang] = useState('es');
  const [openIndex, setOpenIndex] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleItem = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  const currentFaqs = FAQS_DATA[lang];

  return (
    <section className="faq-section" style={{
      maxWidth: '1200px',
      margin: '2rem auto 1.5rem auto',
      padding: '0 1rem',
      fontFamily: 'inherit'
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #18181b 0%, #09090b 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.35)'
      }}>
        {/* Encabezado */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          paddingBottom: isExpanded ? '1rem' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444'
            }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <h2 style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-0.02em'
              }}>
                {lang === 'es' ? 'Preguntas Frecuentes & Guía Local' : 'Frequently Asked Questions & Local Guide'}
              </h2>
              <p style={{
                fontSize: '0.8rem',
                color: '#d4d4d8',
                margin: '0.2rem 0 0 0'
              }}>
                Paterson, Clifton, Passaic & North Jersey • 24/7
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Toggle de Idioma */}
            <div style={{
              display: 'inline-flex',
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '2px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <button
                type="button"
                onClick={() => setLang('es')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: lang === 'es' ? '#b91c1c' : 'transparent',
                  color: '#ffffff',
                  transition: 'background 0.2s'
                }}
              >
                Español
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: lang === 'en' ? '#b91c1c' : 'transparent',
                  color: '#ffffff',
                  transition: 'background 0.2s'
                }}
              >
                English
              </button>
            </div>

            {/* Botón expandir/colapsar sección */}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {isExpanded ? (
                <><span>Ocultar</span><ChevronUp size={16} /></>
              ) : (
                <><span>Ver Respuestas (6)</span><ChevronDown size={16} /></>
              )}
            </button>
          </div>
        </div>

        {/* Acordeón de Preguntas y Respuestas */}
        {isExpanded && (
          <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {currentFaqs.map((faq, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  style={{
                    background: isOpen ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid',
                    borderColor: isOpen ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(idx)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'none',
                      border: 'none',
                      color: isOpen ? '#f87171' : '#f3f4f6',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      gap: '0.75rem'
                    }}
                  >
                    <span>{faq.q}</span>
                    <span style={{ color: 'rgba(255, 255, 255, 0.5)', flexShrink: 0 }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{
                      padding: '0 1rem 1rem 1rem',
                      fontSize: '0.85rem',
                      lineHeight: '1.55',
                      color: 'rgba(255, 255, 255, 0.8)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.04)',
                      paddingTop: '0.75rem'
                    }}>
                      <p style={{ margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Micro datos de contacto local */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '0.5rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '0.78rem',
              color: 'rgba(255, 255, 255, 0.65)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={14} color="#ef4444" />
                <span>21 Mill St, Paterson, NJ 07011</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={14} color="#ef4444" />
                <span>Abierto 24 Horas / 7 Días</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Phone size={14} color="#ef4444" />
                <span>(973) 653-3749</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

