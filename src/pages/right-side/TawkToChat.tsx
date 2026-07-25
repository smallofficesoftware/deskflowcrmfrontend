    import TawkMessengerReact from '@tawk.to/tawk-messenger-react';
    import React from 'react';

    function TawkToChat() {
    
      const propertyId = '68a56c9d727c171927b34bce';
      const widgetId = '1j3330irj'; 
      return (
        <div className="">
     
          {/* Your other React components */}
          <TawkMessengerReact
            propertyId={propertyId}
            widgetId={widgetId}
          />
        </div>
      );
    }

    export default TawkToChat;