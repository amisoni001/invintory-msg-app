import { useState, useEffect, useCallback } from "react";
import { Card, Page, TextField, Layout, Button, Toast, Frame } from "@shopify/polaris";

export default function MessageSettings() {
  const [ukMessage, setUkMessage] = useState("Ready to dispatch — Ships within 2-3 days");
  const [usMessage, setUsMessage] = useState("Available — Ships within 5-6 days");
  const [indiaMessage, setIndiaMessage] = useState("Made to order — Ships within 8-10 days");
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState("");


  const toggleToast = useCallback(() => setToastActive((active) => !active), []);

   // ✅ Fetch messages on component load
   useEffect(() => {
    fetch('http://localhost:3000/api/get-messages')
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setUkMessage(data.uk_message);
        setUsMessage(data.us_message);
        setIndiaMessage(data.india_message);
      })
      .catch((err) => console.error("Failed to fetch messages:", err));
  }, []);

  const handleSave = () => {
    fetch('http://localhost:3000/api/save-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ukMessage,
        usMessage,
        indiaMessage,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setToastContent('Messages saved successfully!');
        setToastActive(true); // ✅ Show Toast
      })
      .catch((err) => console.error(err));
  };
  // ✅ Dismiss the toast after a few seconds
  const toggleToastActive = useCallback(() => setToastActive(false), []);

  return (
    <Frame>
      <Page title="PDP Message Settings">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <div style={{ marginBottom: '20px' }}>
                <TextField
                  label="UK Message"
                  value={ukMessage}
                  onChange={setUkMessage}
                  multiline
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <TextField
                  label="US Message"
                  value={usMessage}
                  onChange={setUsMessage}
                  multiline
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <TextField
                  label="India Message"
                  value={indiaMessage}
                  onChange={setIndiaMessage}
                  multiline
                />
              </div>

              <Button primary onClick={handleSave}>
                Save Messages
              </Button>
            </Card>
          </Layout.Section>
        </Layout>

        {/* ✅ Toast Notification */}
        {toastActive && (
            <Toast content={toastContent} onDismiss={toggleToast} duration={3000} />
        )}
      </Page>
    </Frame>
  );
}
