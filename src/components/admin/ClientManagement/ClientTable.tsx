import React, { useCallback, useMemo } from 'react';
import { User, Trash2 } from 'lucide-react';
import { Client } from '../../../types/admin';

interface ClientTableProps {
  clients: Client[];
  onDeleteClient: (clientId: string, clientName: string) => Promise<void>;
  onUploadScript: (clientId: string) => void;
  isLoading: boolean;
}

const ClientTable = React.memo(({
  clients,
  onDeleteClient,
  onUploadScript,
  isLoading
}: ClientTableProps) => {
  const parseDate = useCallback((dateString: string): Date | null => {
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }, []);

  // Memoized handlers that work with client data
  const handleUploadScript = useCallback((clientId: string) => {
    onUploadScript(clientId);
  }, [onUploadScript]);

  const handleDeleteClient = useCallback((clientId: string, clientName: string) => {
    onDeleteClient(clientId, clientName);
  }, [onDeleteClient]);

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">Active Clients</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your client accounts and their configurations</p>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <User className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding your first client.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Active Clients</h3>
        <p className="text-sm text-gray-500 mt-1">Manage your client accounts and their configurations</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-500">
            <tr>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Client Information</span>
                <span className="sm:hidden">Client</span>
              </th>
              <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Configuration
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scripts
              </th>
              <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate" title={client.name}>{client.name}</div>
                      <div className="text-xs text-gray-500 truncate" title={client.id}>ID: {client.id}</div>
                      {/* Mobile: Show contact info here */}
                      <div className="md:hidden text-xs text-gray-500 mt-1 truncate" title={client.email}>
                        {client.email}
                      </div>
                      <div className="md:hidden text-xs text-gray-400">
                        {parseDate(client.createdAt)?.toLocaleDateString() || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{client.email}</div>
                  <div className="text-sm text-gray-500">
                    Registered: {parseDate(client.createdAt)?.toLocaleDateString() || 'N/A'}
                  </div>
                </td>
                <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Subdomain: {client.subdomain}</div>
                  <div className="text-sm text-gray-500">{client.scripts?.length || 0} scripts</div>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                  <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full ${
                    client.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className="hidden sm:inline">{client.status}</span>
                    <span className="sm:hidden">{client.status === 'active' ? '✓' : '✗'}</span>
                  </span>
                  {/* Mobile: Show script count here */}
                  <div className="sm:hidden text-xs text-gray-500 mt-1">
                    {client.scripts?.length || 0} scripts
                  </div>
                </td>
                <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {client.scripts?.length > 0 ? (
                    <div className="space-y-1">
                      {client.scripts.slice(0, 2).map((script, index) => (
                        <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1 truncate max-w-[120px]" title={script}>
                          {script}
                        </div>
                      ))}
                      {client.scripts.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{client.scripts.length - 2} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">No scripts</span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <button 
                      onClick={() => handleUploadScript(client.id)}
                      disabled={isLoading}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 sm:px-3 py-2 rounded text-xs transition-colors disabled:opacity-50 min-h-[44px] touch-manipulation flex items-center justify-center"
                      title="Upload Script"
                    >
                      <span className="hidden sm:inline">Upload Script</span>
                      <span className="sm:hidden">Upload</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteClient(client.id, client.name)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 min-w-[44px] min-h-[44px] p-2 rounded transition-colors disabled:opacity-50 touch-manipulation flex items-center justify-center"
                      title="Delete Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for performance
  return (
    prevProps.clients === nextProps.clients &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.onDeleteClient === nextProps.onDeleteClient &&
    prevProps.onUploadScript === nextProps.onUploadScript
  );
});

ClientTable.displayName = 'ClientTable';

export default ClientTable;