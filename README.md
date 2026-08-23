# Sahayak — AI for Public Good

> **Eight Communities. Grounded Answers. Or None at All.**

Sahayak is a practical, multilingual, offline-resilient AI platform designed to put domain-specific intelligence into the hands of underserved communities across India.

Built for **OOSC 4.0 · Problem Statement 5**, Sahayak combines live data, multimodal AI, deterministic decision logic, accessibility features, and community-specific workflows into one unified platform.

---

## 🌍 The Problem

Generic AI is powerful, but it often fails in grassroots contexts.

### Hallucination Risk

In critical domains, an AI-generated answer can have real consequences. An incorrect pesticide recommendation, dosage, eligibility requirement, or safety interpretation can cause harm.

### Language & Access Barriers

Many existing digital tools are English-first, require strong connectivity, and assume users are comfortable with conventional interfaces.

### Lack of Domain Grounding

Generic assistants are not inherently connected to domain-specific sources such as agricultural market data, educational material, or marine-condition information.

### Our Core Rule

> **Grounded answers, or none at all.**

When reliable information is unavailable, Sahayak should refuse rather than fabricate.

---

# 🧠 What is Sahayak?

Sahayak is built around a **shared intelligence layer** with community-specific workflows.

Instead of building eight isolated applications, the platform adapts its:

* Data
* AI reasoning
* Workflows
* Interfaces
* Accessibility
* Decision logic

to the needs of each community.

---

# 👥 Eight Communities

| Module                                | Purpose                                                     |
| ------------------------------------- | ----------------------------------------------------------- |
| 🌾 **Farmers**                        | Crop assistance, image-based analysis and live mandi prices |
| 🌊 **Fishermen**                      | Marine conditions and safety-oriented interpretation        |
| 🧵 **Artisans & Small Producers**     | Product photo → marketplace-ready listing                   |
| 🏪 **Micro-Entrepreneurs & Vendors**  | Daily records and demand-oriented assistance                |
| 🏛️ **Public Services Navigator**     | Scheme eligibility and document guidance                    |
| ♿ **Persons with Disabilities**       | Accessible interaction and assistance                       |
| 📚 **Rural Education**                | Grounded educational explanations                           |
| 🌪️ **Disaster & Climate Resilience** | Hazard information and emergency guidance                   |

---

# 🌾 Farmers

The Farmers module combines AI assistance with real market information.

### Crop Assistance

Users can provide a photograph of an affected crop or leaf for image-based analysis.

### Grounded Guidance

The intelligence layer generates practical guidance while avoiding unsupported recommendations.

### Live Mandi Prices

Users can select crops and access market information including:

* Market
* State
* Minimum price
* Modal price
* Maximum price
* Date

Supported crop workflows include Wheat, Rice, Cotton, Potato, Onion and Maize.

---

# 🌊 Fishermen — Marine Navigator

Marine conditions can be difficult for non-specialists to interpret.

Sahayak converts information such as:

* Wave height
* Swell height
* Wave period
* Wind speed
* Wind gusts
* Wind direction

into a simpler safety-oriented interpretation.

The goal is to translate complex marine information into something a fisherman can understand and act upon.

> **Important:** Sahayak is decision support, not an authoritative replacement for official marine or Coast Guard warnings.

---

# 🧵 Artisans & Small Producers

A product photograph can become the starting point for a digital marketplace listing.

The workflow can generate:

* Bilingual product title
* Product description
* Fair price band
* Marketplace tags

The goal is to reduce the digital barrier between a physical product and online commerce.

---

# 🏪 Micro-Entrepreneurs & Vendors

Sahayak provides local-first business assistance through:

* Daily cash and stock records
* Demand-oriented forecasting
* Inventory decision support

This can help small vendors make better everyday operational decisions.

---

# 🏛️ Public Services Navigator

Government schemes can be difficult to navigate because eligibility rules and documentation requirements are often complex.

Sahayak provides:

* Plain-language eligibility guidance
* Scheme discovery
* Document checklists
* Deterministic eligibility matching where applicable

The system is designed to rely on defined criteria and official information rather than letting a generative model invent eligibility requirements.

---

# 📚 Rural Education

Sahayak provides educational assistance for learners who may not have easy access to personalized support.

The Rural Education module focuses on:

* Step-by-step explanations
* Simplified learning
* Grounded educational content
* Verifiable source context

---

# 🌪️ Disaster & Climate Resilience

The platform can translate hazard information into actionable assistance.

Potential workflows include:

* District-level hazard information
* Flood guidance
* Cyclone guidance
* Emergency checklists
* Climate-related alerts

Official emergency sources should always take precedence over AI-generated interpretation.

---

# 🏗️ Architecture

Sahayak uses a hybrid architecture combining AI, live data and deterministic systems.

```text
                    ┌──────────────────────┐
                    │      Sahayak UI      │
                    │  Multilingual / PWA  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     FastAPI API      │
                    │   Backend Services    │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
      ┌─────────────┐   ┌──────────────┐  ┌──────────────┐
      │ Live Data   │   │   Gemini     │  │ Deterministic│
      │   Sources   │   │ Intelligence │  │    Rules     │
      └─────────────┘   └──────────────┘  └──────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Grounded Response    │
                    │ + User Context       │
                    └──────────────────────┘
```

---

# ⚙️ Technology Stack

### Frontend

* Next.js 15
* Progressive Web App architecture
* Responsive interface
* Multilingual UI
* Accessibility-focused interactions

### Backend

* Python
* FastAPI
* REST APIs

### Intelligence

* Google Gemini
* Multimodal reasoning
* Structured responses
* Community-specific workflows

### Edge / Local AI

* ONNX-based inference where applicable
* CPU-optimized local inference

### Data

* Agmarknet / mandi data
* Open-Meteo
* Domain-specific reference information
* Community-specific datasets

### Deployment

* Vercel — Frontend
* Render — Backend
* Environment-based secret management

---

# 🔐 Grounding & Safety

Sahayak is designed around a simple principle:

> **AI should not sound confident when the underlying information is uncertain.**

For critical workflows, the system combines:

* Structured data
* Verified reference sources
* Deterministic rules
* Structured AI responses
* Explicit refusal/fallback behavior

This is particularly important for agriculture, public services, education and safety-related use cases.

---

# ♿ Accessibility

Accessibility is treated as a platform-level feature rather than an individual module.

Sahayak supports or is designed around:

* Multilingual interaction
* Hindi/English parity
* Voice interaction
* Large-text scaling
* Screen-reader-friendly interfaces
* Mobile-first workflows
* Offline-oriented experiences

---

# 📱 Deployment

Sahayak is deployed as a separate frontend and backend architecture:

```text
User
  │
  ▼
Vercel
Frontend
  │
  ▼
Render
FastAPI Backend
  │
  ├── Gemini
  ├── Live Data Sources
  └── Domain Services
```

The deployment uses environment variables for secrets such as the Gemini API key.

**API keys are never intended to be exposed in the frontend.**

---

# 🚀 Roadmap

### Next

* Expand multilingual support
* Improve community-specific grounding
* Strengthen offline workflows
* Expand verified datasets
* Improve voice interaction

### Future

* WhatsApp Business integration
* Offline-first SQLite synchronization
* Expansion to 12 regional languages
* Additional community-specific modules
* Partnerships with NGOs, institutions and public programs

---

# 🎯 Why Sahayak?

Generic AI asks:

> **"How can I answer this question?"**

Sahayak asks:

> **"Who is asking, what do they actually need, and what verified information can help them?"**

That's the difference between a generic chatbot and a **community-focused intelligence platform**.

---

# ❤️ Our Vision

India doesn't need one more chatbot.

It needs technology that understands **context, language, accessibility and reality on the ground**.

Sahayak aims to make advanced AI practical for the communities that are most often left out of conventional digital products.

> ## **One intelligence layer.**
>
> ## **Eight communities.**
>
> ## **Grounded answers, or none at all.**

---

## Built for OOSC 4.0

**Problem Statement 5 — AI for Public Good**

Built with ❤️ for India.
