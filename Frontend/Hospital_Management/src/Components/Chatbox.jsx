
import React, { useCallback, useEffect, useRef, useState } from "react";
import API from "../Services/Api";
import "./Chatbox.css";

const Chatbox = ({ role: roleProp }) => {
    const role = (
        roleProp || localStorage.getItem("role") || ""
    ).toUpperCase();

    const [conversations, setConversations] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");

    const bottomRef = useRef(null);
    const selectedRef = useRef(null);

    useEffect(() => {
        selectedRef.current = selectedAppointment;
    }, [selectedAppointment]);

    const loadConversations = useCallback(async () => {
        try {
            const response = await API.get("chat/conversations/");
            setConversations(response.data);
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load conversations. Please log in again if your session expired."
            );
        } finally {
            setLoadingChats(false);
        }
    }, []);

    const loadMessages = useCallback(async (appointmentId, showLoader = false) => {
        if (showLoader) setLoadingMessages(true);

        try {
            const response = await API.get(
                `chat/conversations/${appointmentId}/messages/`
            );

            if (Number(selectedRef.current) === Number(appointmentId)) {
                setMessages(response.data);
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to load messages."
            );
        } finally {
            if (showLoader) setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!selectedAppointment) {
            setMessages([]);
            return;
        }

        loadMessages(selectedAppointment, true);

        const timer = setInterval(() => {
            loadMessages(selectedAppointment);
            loadConversations();
        }, 3000);

        return () => clearInterval(timer);
    }, [selectedAppointment, loadMessages, loadConversations]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const openConversation = (appointmentId) => {
        setSelectedAppointment(appointmentId);
        selectedRef.current = appointmentId;
        setMessages([]);
        setError("");
    };

    const sendMessage = async (event) => {
        event.preventDefault();

        const content = message.trim();

        if (!content || !selectedAppointment || sending) return;

        setSending(true);
        setError("");

        try {
            const response = await API.post(
                `chat/conversations/${selectedAppointment}/messages/`,
                { content }
            );

            setMessages((previous) => {
                const exists = previous.some(
                    (item) => item.id === response.data.id
                );

                return exists ? previous : [...previous, response.data];
            });

            setMessage("");
            await loadConversations();
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Message send panna mudiyala. Please try again."
            );
        } finally {
            setSending(false);
        }
    };

    const formatTime = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (value) => {
        if (!value) return "";
        return new Date(value).toLocaleDateString();
    };

    if (role !== "DOCTOR" && role !== "PATIENT") {
        return (
            <div className="chat-page container-fluid">
                <div className="chat-error alert alert-warning" role="alert">
                    Please log in with a Doctor or Patient account to use chat.
                </div>
            </div>
        );
    }

    const activeConversation = conversations.find(
        (item) =>
            Number(item.appointment_id) === Number(selectedAppointment)
    );

    return (
        <div className="chat-page container-fluid">
            <div className="chat-heading d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="chat-heading-text">
                    <span className="chat-eyebrow">
                        <i className="bi bi-shield-check me-2"></i>
                        Secure communication
                    </span>

                    <h2>Messages</h2>

                    <p>
                        Communicate securely with your{" "}
                        {role === "DOCTOR" ? "patients" : "doctor"}.
                    </p>
                </div>

                <button
                    type="button"
                    className="chat-refresh btn"
                    onClick={loadConversations}
                    disabled={loadingChats}
                >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    {loadingChats ? "Loading..." : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="chat-error alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    <span>{error}</span>
                </div>
            )}

            <div className="chat-layout">
                <aside className="chat-sidebar">
                    <div className="chat-sidebar-heading">
                        <div>
                            <h3>Conversations</h3>
                            <p>Your appointment chats</p>
                        </div>

                        <span className="chat-count">
                            {conversations.length}
                        </span>
                    </div>

                    <div className="chat-contact-list">
                        {loadingChats ? (
                            <div className="chat-empty">
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Loading chats...
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="chat-empty">
                                <i className="bi bi-chat-square-text"></i>
                                <p>No appointment conversations found.</p>
                                <small>
                                    Your available chats will appear here.
                                </small>
                            </div>
                        ) : (
                            conversations.map((chat) => (
                                <button
                                    type="button"
                                    key={chat.appointment_id}
                                    className={`chat-contact ${
                                        Number(selectedAppointment) ===
                                        Number(chat.appointment_id)
                                            ? "active"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        openConversation(chat.appointment_id)
                                    }
                                >
                                    <span className="chat-avatar">
                                        {(chat.other_user_name || "?")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </span>

                                    <span className="chat-contact-info">
                                        <strong>
                                            {chat.other_user_name || "Unknown user"}
                                        </strong>

                                        <small className="chat-appointment-label">
                                            <i className="bi bi-calendar2-check me-1"></i>
                                            Appointment #{chat.appointment_id}
                                        </small>

                                        <span className="chat-last-message">
                                            {chat.last_message ||
                                                "Start a conversation"}
                                        </span>
                                    </span>

                                    <i className="bi bi-chevron-right chat-contact-arrow"></i>
                                </button>
                            ))
                        )}
                    </div>
                </aside>

                <section className="chat-conversation">
                    {!selectedAppointment ? (
                        <div className="chat-welcome">
                            <div className="chat-welcome-icon">
                                <i className="bi bi-chat-dots"></i>
                            </div>

                            <h3>Select a conversation</h3>

                            <p>
                                Choose an appointment from the conversation
                                list to view messages and reply.
                            </p>

                            <span className="chat-secure-note">
                                <i className="bi bi-lock-fill me-2"></i>
                                Private appointment communication
                            </span>
                        </div>
                    ) : (
                        <>
                            <header className="chat-conversation-header">
                                <div className="chat-avatar chat-header-avatar">
                                    {(activeConversation?.other_user_name || "?")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="chat-header-info">
                                    <strong>
                                        {activeConversation?.other_user_name ||
                                            "Conversation"}
                                    </strong>

                                    <small>
                                        Appointment #{selectedAppointment}
                                        {activeConversation?.appointment_status
                                            ? ` · ${activeConversation.appointment_status}`
                                            : ""}
                                    </small>

                                    {activeConversation?.appointment_date && (
                                        <small>
                                            <i className="bi bi-calendar3 me-1"></i>
                                            {formatDate(
                                                activeConversation.appointment_date
                                            )}
                                            {" · "}
                                            {String(
                                                activeConversation.appointment_time || ""
                                            ).slice(0, 5)}
                                        </small>
                                    )}
                                </div>

                                <span className="chat-online-indicator">
                                    <span></span>
                                    Chat
                                </span>
                            </header>

                            <div className="chat-messages">
                                {loadingMessages && messages.length === 0 ? (
                                    <div className="chat-empty">
                                        <span
                                            className="spinner-border spinner-border-sm me-2"
                                            role="status"
                                        ></span>
                                        Loading messages...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="chat-first-message">
                                        <div className="chat-first-icon">
                                            <i className="bi bi-chat-heart"></i>
                                        </div>
                                        <p>No messages yet</p>
                                        <span>
                                            Send a message to start chatting.
                                        </span>
                                    </div>
                                ) : (
                                    messages.map((item) => {
                                        const mine =
                                            Number(item.sender) ===
                                            Number(localStorage.getItem("user_id"));

                                        return (
                                            <div
                                                key={item.id}
                                                className={`chat-message-row ${
                                                    mine ? "mine" : "theirs"
                                                }`}
                                            >
                                                <div className="chat-bubble">
                                                    {!mine && (
                                                        <small className="chat-sender">
                                                            {item.sender_name}
                                                        </small>
                                                    )}

                                                    <p>{item.content}</p>

                                                    <span className="chat-time">
                                                        {formatTime(item.created_at)}
                                                        {mine && (
                                                            <i className="bi bi-check2-all ms-1"></i>
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}

                                <div ref={bottomRef} />
                            </div>

                            <form
                                className="chat-compose"
                                onSubmit={sendMessage}
                            >
                                <div className="chat-input-wrap">
                                    <i className="bi bi-chat-left-text"></i>

                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(event) =>
                                            setMessage(event.target.value)
                                        }
                                        placeholder="Type your message..."
                                        maxLength={5000}
                                        aria-label="Type your message"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="chat-send btn"
                                    disabled={!message.trim() || sending}
                                >
                                    {sending ? (
                                        <>
                                            <span
                                                className="spinner-border spinner-border-sm"
                                                role="status"
                                            ></span>
                                            <span>Sending</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Send</span>
                                            <i className="bi bi-send-fill"></i>
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="chat-footer-note">
                                <i className="bi bi-shield-lock me-1"></i>
                                Keep your medical communication private.
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Chatbox;
