import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useStore } from 'react-redux';
import { logoStore, presetStore, imageStore } from '../store';

const AuthContext: React.FC = () => {
  const session = useSession();
  const store = useStore();

  useEffect(() => {
    if (session) {
      // Load resources when user is authenticated
      const loadResources = async () => {
        try {
          // Load user-specific and default resources
          await Promise.all([
            logoStore.getState().fetchLogos(),
            presetStore.getState().fetchPresets(),
            imageStore.getState().fetchCloudinaryImages(session.user.id)
          ]);
        } catch (error) {
          console.error("Error loading resources:", error);
        }
      };
      
      loadResources();
    }
  }, [session]);

  return (
    // Rest of the component code
  );
};

export default AuthContext; 