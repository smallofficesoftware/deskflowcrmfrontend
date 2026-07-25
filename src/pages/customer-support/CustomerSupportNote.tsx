const CustomerSupportNote = () => {
    return (
        <div style={{ padding: "0 5px 10px 10px" }}>
            <div className="card w-100" style={{ width: "30vw", fontSize: "13px" }}>
                <div className="card-body">
                    <h5>📌 Support Ticket Guidelines</h5>

                    <p><strong>Customer Support Availability:</strong><br />
                        Monday to Saturday | 10:00 AM to 6:00 PM<br />
                        Lunch Break hours | 1:30 PM to 2:30 PM</p>

                    <h6>🔄 Ticket Process Flow</h6>

                    <p><strong>Step 1: Ticket Submission</strong><br />
                        Once you submit a ticket, the initial status will be “Pending for review.”</p>

                    <p><strong>Step 2: Ticket Review</strong><br />
                        Our support team will review your ticket based on the provided description and update the status accordingly.</p>

                    <p><strong>Step 3: Communication (If Required)</strong><br />
                        If needed, our team will contact you on your registered mobile number.</p>

                    <p><strong>Step 4: Status Updates</strong><br />
                        Your ticket may move through different statuses such as:</p>

                    <ul>
                        <li>Pending for Preview</li>
                        <li>Reviewed</li>
                        <li>Possible in Upcoming Update (15th Date)</li>
                        <li>Possible in Upcoming Update (30th Date)</li>
                        <li>Future Planning</li>
                        <li>Rejected by the Support Team</li>
                        <li>Rejected by the Client</li>
                        <li>Resolved</li>
                        <li>Maybe in Future Planning</li>
                        <li>Customization Request</li>
                        <li>Under R&amp;D</li>
                        <li>On Hold</li>
                    </ul>

                    <h6>⏱️ Resolution Timeline</h6>

                    <ul>
                        <li><strong>Ticket Response Duration:</strong> Typically answered within 24 to 48 hours.</li>
                        <li><strong>Resolution time:</strong> Depends on the ticket.
                        </li>
                    </ul>

                    <h6>📞 Need Further Assistance?</h6>

                    <p>If your issue is still unresolved:</p>
                    <ul>
                        <li>Contact our Sales Team via call</li>
                        <li>Email us at: <a href="mailto:support@deskflowcrm.com">support@deskflowcrm.com</a><br />
                            <a href="mailto:sales@deskflowcrm.com">sales@deskflowcrm.com</a></li>
                    </ul>

                    <h6>⚠️ Important Note</h6>

                    <p>
                        Management reserves the right to modify this SOP at any time to improve customer experience.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CustomerSupportNote;