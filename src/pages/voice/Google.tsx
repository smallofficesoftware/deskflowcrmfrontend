import React, { useEffect, useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

const GoogleLoginComponent: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('googleUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user info
        const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!userRes.ok) {
          throw new Error(`HTTP error! status: ${userRes.status}`);
        }

        const userInfo = await userRes.json();
        setUser(userInfo);
        localStorage.setItem('googleUser', JSON.stringify(userInfo));

        const contactsRes = await fetch('https://people.googleapis.com/v1/people/me/connections', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!contactsRes.ok) {
          throw new Error(`Failed to fetch contacts: ${contactsRes.status}`);
        }

        const contactsData = await contactsRes.json();
        const userContacts = contactsData.connections || [];
        const mobileContacts = userContacts
          .map((contact: any) => {
            const phoneNumber = contact.phoneNumbers?.find((number: any) => number.type === 'mobile');
            return phoneNumber ? phoneNumber.value : null;
          })
          .filter((mobile: any) => mobile !== null);

        setContacts(mobileContacts);

      } catch (error) {
        console.error('Failed to fetch user info or contacts:', error);
      }
    },
    onError: (error) => {
      console.error('Login Failed:', error);
    },
    scope: 'openid email profile https://www.googleapis.com/auth/contacts.readonly',
  });

  const handleLogout = () => {
    setUser(null);
    setContacts([]);
    localStorage.removeItem('googleUser');
  };

  return (
    <div style={{ marginTop: '50px', textAlign: 'center' }}>
      {user ? (
        <div>
          <h2>Welcome, {user.name}</h2>
          <img src={user.picture} alt="Profile" style={{ borderRadius: '50%' }} />
          <p>Email: {user.email}</p>
          <h3>Mobile Numbers:</h3>
          <ul>
            {contacts.length > 0 ? (
              contacts.map((mobile, index) => <li key={index}>{mobile}</li>)
            ) : (
              <p>No mobile contacts found.</p>
            )}
          </ul>
          <button onClick={handleLogout} style={{ marginTop: '20px', padding: '10px 20px' }}>
            Logout
          </button>
        </div>
      ) : (
        <>
          <h2>Login with Google</h2>
          <button onClick={() => login()} style={{ padding: '10px 20px' }}>
            Sign In with Google
          </button>
        </>
      )}
    </div>
  );
};

export default GoogleLoginComponent;
