import React, { useState } from 'react';
import { Connection } from '../types';
import Loader from './Loader';

interface LoginScreenProps {
  onConnect: (credentials: { server: string; username: string; password: string; connectionName: string }, saveCredentials: boolean) => Promise<void>;
  onUseSavedConnection: (connection: Connection) => Promise<void>;
  onDeleteSavedConnection: (id: string) => Promise<void>;
  onLoadSavedConnections: () => Promise<void>;
  savedConnections: Connection[];
  loading: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onConnect,
  onUseSavedConnection,
  onDeleteSavedConnection,
  onLoadSavedConnections,
  savedConnections,
  loading
}) => {
  const [server, setServer] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [connectionName, setConnectionName] = useState('');
  const [connectLoading, setConnectLoading] = useState(false);
  const [saveConnectLoading, setSaveConnectLoading] = useState(false);
  const [savedConnectionLoading, setSavedConnectionLoading] = useState<string | null>(null);

  const handleConnect = async (saveCredentials: boolean) => {
    if (!server || !username || !password) {
      return;
    }
    
    if (saveCredentials) {
      setSaveConnectLoading(true);
    } else {
      setConnectLoading(true);
    }
    
    try {
      await onConnect({ server, username, password, connectionName }, saveCredentials);
    } finally {
      setConnectLoading(false);
      setSaveConnectLoading(false);
    }
  };

  const handleUseSavedConnection = async (connection: Connection) => {
    setSavedConnectionLoading(connection.id);
    try {
      await onUseSavedConnection(connection);
    } finally {
      setSavedConnectionLoading(null);
    }
  };

  return (
    <div id="login-screen" className="screen active">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">🗄️ Byzand</div>
          <h1>MSSQL Client</h1>
          <p>Connect to your SQL Server database</p>
        </div>

        <div className="login-form">
          <div className="form-group">
            <label htmlFor="server">Server *</label>
            <input
              type="text"
              id="server"
              value={server}
              onChange={(e) => setServer(e.target.value)}
              placeholder="server.database.windows.net"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="connection-name">Connection Name (optional)</label>
            <input
              type="text"
              id="connection-name"
              value={connectionName}
              onChange={(e) => setConnectionName(e.target.value)}
              placeholder="My Connection"
            />
          </div>

          <div className="form-actions">
            <button 
              onClick={() => handleConnect(false)} 
              className="btn btn-primary"
              disabled={loading || connectLoading || saveConnectLoading}
            >
              {connectLoading ? <Loader size="small" type="spinner" /> : 'Connect'}
            </button>
            <button 
              onClick={() => handleConnect(true)} 
              className="btn btn-secondary"
              disabled={loading || connectLoading || saveConnectLoading}
            >
              {saveConnectLoading ? <Loader size="small" type="spinner" /> : 'Save & Connect'}
            </button>
          </div>
        </div>

        <div className="saved-connections">
          <div className="saved-connections-header">
            <h3>Saved Connections</h3>
            <button 
              onClick={onLoadSavedConnections}
              className="btn btn-sm btn-secondary"
              disabled={loading}
            >
              {loading ? <Loader size="small" type="dots" /> : 'Refresh'}
            </button>
          </div>
          {savedConnections && savedConnections.length > 0 ? (
            savedConnections.map((conn) => (
              <div key={conn.id} className="saved-connection">
                <div className="connection-info">
                  <div className="connection-name">{conn.name}</div>
                  <div className="connection-details">{conn.server}</div>
                </div>
                <div className="connection-actions">
                  <button 
                    onClick={() => handleUseSavedConnection(conn)}
                    className="btn btn-sm btn-primary"
                    disabled={loading || savedConnectionLoading === conn.id}
                  >
                    {savedConnectionLoading === conn.id ? <Loader size="small" type="spinner" /> : 'Connect'}
                  </button>
                  <button 
                    onClick={() => onDeleteSavedConnection(conn.id)}
                    className="btn btn-sm btn-danger"
                    disabled={loading}
                  >
                    {loading ? <Loader size="small" type="pulse" /> : 'Delete'}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-saved-connections">
              <p>No saved connections found</p>
              <p>Connect and save your first connection to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
