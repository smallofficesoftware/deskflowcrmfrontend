import { Guide } from "../types";

export const onboardingGuide: Guide = {
  id: "onboarding",
  title: { en: "Quick onboarding", hi: "तुरंत शुरुआत" },
  steps: [
    {
      title: { en: "Welcome to Deskflow", hi: "Deskflow में आपका स्वागत है" },
      text: {
        en: "I will show you how to set up your company and create your first contact. Press Next to continue.",
        hi: "मैं आपको कंपनी सेटअप करना और पहला कॉन्टैक्ट बनाना दिखाऊंगा। आगे बढ़ने के लिए Next दबाएं।",
      },
    },
    {
      selector: "#dropDown2",
      title: { en: "Open the menu", hi: "मेन्यू खोलें" },
      text: {
        en: "Click this three dots button to open the menu.",
        hi: "मेन्यू खोलने के लिए इस तीन डॉट वाले बटन पर क्लिक करें।",
      },
      side: "bottom",
    },
    {
      selector: "#dropLeft li.listItem",
      clickFirst: "#dropDown2",
      title: { en: "Settings", hi: "सेटिंग्स" },
      text: {
        en: "Click Settings to set up your company, modules, prefixes and integrations.",
        hi: "कंपनी, मॉड्यूल, प्रीफ़िक्स और इंटीग्रेशन सेट करने के लिए Settings पर क्लिक करें।",
      },
      side: "left",
    },
    {
      selector: 'span[title="Create Contact"]',
      title: { en: "Create a contact", hi: "कॉन्टैक्ट बनाएं" },
      text: {
        en: "Click this plus button to create your first contact.",
        hi: "अपना पहला कॉन्टैक्ट बनाने के लिए इस प्लस बटन पर क्लिक करें।",
      },
      side: "bottom",
    },
  ],
};

export const createContactGuide: Guide = {
  id: "create-contact",
  title: { en: "How to create a contact", hi: "कॉन्टैक्ट कैसे बनाएं" },
  steps: [
    {
      selector: 'span[title="Create Contact"]',
      title: { en: "Click the plus button", hi: "प्लस बटन दबाएं" },
      text: {
        en: "Click this plus button. The contact form will open.",
        hi: "इस प्लस बटन पर क्लिक करें। कॉन्टैक्ट फ़ॉर्म खुल जाएगा।",
      },
      side: "bottom",
    },
  ],
};

export const guides: Guide[] = [onboardingGuide, createContactGuide];
