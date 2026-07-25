import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table } from 'react-bootstrap';

const SentEmailsTable = () => {
  const [sentEmails, setSentEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchSentEmails = async () => {
      try {
        const response = await axios.get('http://192.168.1.54:5001/labels');
        setSentEmails(response.data.emails);

      } catch (err) {
        setError('Failed to fetch sent emails.');
      } finally {
        setLoading(false);
      }
    };

    fetchSentEmails();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="container mt-5">
      <h2>Sent Emails</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Subject</th>
            <th>Recipient</th>
            <th>Snippet</th>
          </tr>
        </thead>
        <tbody>
          {sentEmails.map((email, index) => (
            <tr key={email.id}>
              <td>{index + 1}</td>
              <td>{email.subject}</td>
              <td>{email.to}</td>
              <td>{email.snippet}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default SentEmailsTable;
