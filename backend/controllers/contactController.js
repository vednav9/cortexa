import Contact from "../models/Contact.js";

export const submitContactForm = async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const newContact = new Contact({ name, email, message });
        await newContact.save();

        res.status(201).json({ success: true, message: "Your message has been received" });
    } catch (error) {
        console.error("Error submitting contact form:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
