import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import notify from "react-hot-toast";
import { toast } from "react-toastify";
import Navbar from "./Navbar";


export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  const [folders, setFolders] = useState([]); // always an array
  const [files, setFiles] = useState([]); // always an array
  const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState([]); // array of { id, name }
  const [currentFolder, setCurrentFolder] = useState(null); // active folder object
  
  // Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareWith, setShareWith] = useState("");
  const [role, setRole] = useState("viewer");

  const [trashOpen, setTrashOpen] = useState(false);
const [trashFiles, setTrashFiles] = useState([]);
const [trashFolders, setTrashFolders] = useState([]);

const [filteredFolders, setFilteredFolders] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([])


  // Create a folder in current location
  const handleCreateFolder = async () => {
    const name = window.prompt("Folder name?");
    if (!name?.trim()) return;
    try {
      await api.post("/folders/create", { name, parentId: currentFolderId });
      notify.success("Folder created");
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to create folder");
    }
  };

  // Open a folder (drill down)
  const openFolder = (folderId) => {
    setCurrentFolderId(folderId.id);
    setCurrentFolder(folderId);
    // console.log("Opening folder:", folderId);
    setBreadcrumb((prev) => [
    ...prev,
    { id: folderId, name: folderId.name },
  ]);
  };

  // Go to root
  const goRoot = () => setCurrentFolderId(null);

  // Get signed URL and open file
  const openFile = async (fileId) => {
    try {
      // console.log("Opening file:", fileId);
      
      const { data } = await api.get(`/files/${fileId}`);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        notify.error("No signed URL returned");
      }
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to open file");
    }
  };

  // Delete (soft delete) a file
  const handleDelete = async (id) => {
    if (!window.confirm("Move this file to trash?")) return;
    try {
      // backend route: DELETE /files/file/:fileId
      await api.delete(`/files/file/${id}`);
      notify.success("File moved to trash");
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Delete failed");
    }
  };

  // Upload into current folder
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (currentFolderId) formData.append("folderId", currentFolderId);
      await api.post("/files/upload", formData);
      notify.success("File uploaded");
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  // Fetch folders and files for current folder
  const fetchData = async () => {
    try {
      setLoading(true);
      const [foldersRes, filesRes] = await Promise.all([
        api.get("/folders/", { params: { parentId: currentFolderId } }),
        api.get("/files", {
          params: { folderId: currentFolderId, limit: 100, offset: 0 },
        }),
      ]);
      setFolders(
        Array.isArray(foldersRes?.data?.folders) ? foldersRes.data.folders : []
      );
      setFiles(Array.isArray(filesRes?.data?.files) ? filesRes.data.files : []);
      setFilteredFolders(Array.isArray(foldersRes?.data?.folders) ? foldersRes.data.folders : []);
      setFilteredFiles(Array.isArray(filesRes?.data?.files) ? filesRes.data.files : []  );
    } catch (err) {
      console.error(err);
      notify.error(
        err.response?.data?.message || "Failed to fetch files/folders"
      );
      setFolders([]); // keep arrays to avoid .map crash
      setFiles([]);
      
    } finally {
      setLoading(false);
    }
  };

  const fetchTrash = async () => {
  try {
    const [filesRes, foldersRes] = await Promise.all([
      api.get("/files/trash"),
      api.get("/folders/trash") // <— if backend has it
    ]);
    setTrashFiles(Array.isArray(filesRes.data.files) ? filesRes.data.files : []);
    setTrashFolders(Array.isArray(foldersRes.data.folders) ? foldersRes.data.folders : []);
    setTrashOpen(true);
    // console.log("Trash folders:", foldersRes.data.folders);
  } catch (err) {
    notify.error(err.response?.data?.message || "Failed to fetch trash");
  }
};

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId]);

  const handleSearch = (query) => {
    if (!query.trim()) {
      setFilteredFolders(folders);
      setFilteredFiles(files);
      return;
    }
    const lower = query.toLowerCase();
    setFilteredFolders(folders.filter((f) => f.name.toLowerCase().includes(lower)));
    setFilteredFiles(files.filter((f) => f.name.toLowerCase().includes(lower)));
  };

  const goToFolder = (folderId) => {
  if (!folderId) {
    // Back to root
    setCurrentFolderId(null);
    setCurrentFolder(null);
    setBreadcrumb([]);
    return;
  }

  // Find position of the folder in breadcrumb
  const idx = breadcrumb.findIndex((b) => b.id === folderId);
  if (idx !== -1) {
    setCurrentFolderId(breadcrumb[idx].id);
    setCurrentFolder(breadcrumb[idx]);
    setBreadcrumb(breadcrumb.slice(0, idx + 1)); // trim trail
  }
};

const handleDeleteFolder = async (folderId) => {
  try {
    await api.delete(`/folders/folder/${folderId}`);
    notify.success("Folder moved to trash");
    await fetchData();// refresh
  } catch (err) {
    notify.error(err.response?.data?.message || "Failed to delete folder");
  }
};

  const   handleOpenShareModal = (file) => {
    setSelectedFile(file);
    setShareWith("");
    setRole("viewer");
    setShareModalOpen(true);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
        const response = await api.post("/sharing/share", {
        fileId: selectedFile.id,
        sharedWith: shareWith.trim() === "" ? null : shareWith.trim(),
        role,
      });
      if (response.data.file.generalUrl) {
          notify.success(`Link: ${response.data.file.generalUrl}`);
          // maybe copy to clipboard:
          navigator.clipboard.writeText(response.data.file.generalUrl);
      }
      else{
      notify.success("File shared successfully");
      }
      setShareModalOpen(false);
    } catch (err) {
      notify.error(err.response?.data?.message || "Failed to share file");
    }
  };
  const fetchPermissions = async (fileId) => {
    try {
      const { data } = await api.get(`/sharing/permission/${fileId}`);
      
      const permissions = data.permissions || data; 
      // console.log("Permissions for file:", permissions);
      if (!permissions || permissions.length === 0) {
      toast.info("Not shared with anyone");
      return;
    }
      // notify("hi");
      notify(
        "Shared with: " +
          (permissions
            .map((p) => `${p.shared_with } (${p.role})`)
            .join(", ") || "No one")
      );
    } catch (err) {
      
      // console.error("Fetch permissions error:", err.response?.data || err);
      notify.error(err.response?.data?.message || "Failed to fetch permissions");
    }
  };

  return (
    
    <div className="min-h-screen bg-gray-50 p-6">
      <Navbar onSearch={handleSearch} />

      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-blue-600 mb-4">
        <span
          className="cursor-pointer hover:underline"
          onClick={() => goToFolder(null)}
        >
          Root
        </span>
        {breadcrumb.map((b, idx) => (
          <span key={`${b.id || "root"}-${idx}`} className="flex items-center gap-2">
            <span>/</span>
            <span
              className="cursor-pointer hover:underline"
              onClick={() => goToFolder(b.id)}
            >
              {b.name}
            </span>
          </span>
        ))}
      </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateFolder}
            className="bg-white border px-3 py-2 rounded-lg shadow-sm hover:bg-gray-50"
          >
            + New Folder
          </button>
          <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {uploading ? "Uploading..." : "Upload"}
            <input type="file" onChange={handleUpload} className="hidden" />
          </label>
          <button
  onClick={fetchTrash}
  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800"
>
  🗑️ Trash
</button>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="space-y-8">
          {/* Folders */}
          <section>
            <h2 className="text-lg font-semibold mb-3">Folders</h2>
           {filteredFolders.length === 0 ? (
  <p className="text-gray-500">No folders here.</p>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {filteredFolders.map((f) => (
      <div
        key={f.id}
        className="w-full bg-white border rounded-xl p-4 shadow-sm hover:shadow transition flex flex-col justify-between"
      >
        {/* Top row: folder name + delete button */}
        <div className="flex items-center justify-between">
          <span
            className="font-medium cursor-pointer hover:underline"
            onClick={() => openFolder(f)}
          >
            📁 {f.name}
          </span>
          <button
  onClick={async () => {
    const newName = prompt("Enter new name:", f.name);
    if (!newName) return;

    try {
      await api.patch(`/folders/${f.id}`, { name: newName });
      notify.success("Folder renamed");
      fetchData();
    } catch (err) {
      notify.error("Failed to rename");
    }
  }}
>
  📝
</button>

          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent openFolder
              handleDeleteFolder(f.id);
            }}
            className="text-red-500 hover:text-red-700"
            title="Move to Trash"
          >
            🗑️
          </button>
        </div>

        {/* Metadata */}
        <div className="text-xs text-gray-500 mt-2">
          Created: {new Date(f.created_at).toLocaleString()}
        </div>
      </div>
    ))}
  </div>
)}


          </section>

          {/* Files in current folder (or root) */}
          <section>
            <h2 className="text-lg font-semibold mb-3">
              {currentFolderId ? "Files in this folder" : "Files in Root"}
            </h2>
            {filteredFiles.length === 0 ? (
              <p className="text-gray-500">No files here.</p>
            ) : (
              <ul className="divide-y divide-gray-200 bg-white border rounded-xl shadow-sm">
                {filteredFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {file.type} • {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openFile(file.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDelete(file.id)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                      <button
  onClick={async () => {
    const newName = prompt("Enter new name:", file.name);
    if (!newName) return;

    try {
      await api.patch(`/files/${file.id}`, { name: newName });
      notify.success("File renamed");
      fetchData();
    } catch (err) {
      notify.error("Failed to rename");
    }
  }}
>
  📝
</button>
                      <button
                        onClick={() => handleOpenShareModal(file)}
                        className="text-green-600 hover:underline"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => fetchPermissions(file.id)}
                        className="text-purple-600 hover:underline"
                      >
                        View Shares
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {shareModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              Share File: {selectedFile?.name}
            </h3>
            <form onSubmit={handleShareSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium">
                  Share with (user ID or email):
                </label>
                <input
                  type="text"
                  value={shareWith}
                  onChange={(e) => setShareWith(e.target.value)}
                  placeholder="User ID or leave blank for link"
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Role:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border rounded p-2"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {trashOpen && (
  <div className="fixed inset-0 border-4 border-blue-500 flex items-center justify-center">
    <div className="bg-white border-4 border-blue-500 p-6 rounded-lg shadow-lg w-[500px] max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4">Trash</h3>

      {trashFiles.length === 0 && trashFolders.length === 0 ? (
        <p className="text-gray-500">Trash is empty.</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {trashFolders.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Folders</h4>
              <ul className="divide-y divide-gray-200">
                {trashFolders.map((folder) => (
                  <li
                    key={folder.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div>
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-xs text-gray-500">Folder</div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          try {
                            await api.post(`/folders/folder/restore/${folder.id}`);
                            notify.success("Folder restored");
                            fetchTrash();
                            fetchData();  
                          } catch (err) {
                            notify.error("Failed to restore folder");
                          }
                        }}
                        className="text-green-600 hover:underline"
                      >
                        Restore
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !window.confirm("Permanently delete this folder?")
                          )
                            return;
                          try {
                            await api.delete(
                              `/folders/${folder.id}`
                            );
                            notify.success("Folder permanently deleted");
                            fetchTrash();
                          } catch (err) {
                            notify.error("Failed to delete folder");
                          }
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {trashFiles.map((file) => (
            
            <li key={file.id} className="flex items-center justify-between p-3">
              <div>
                <h4 className="font-semibold mb-2">Files</h4>
                <div className="font-medium">{file.name}</div>
                <div className="text-xs text-gray-500">
                  {file.type} • {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      await api.post(`/files/file/restore/${file.id}`);
                      notify.success("File restored");
                      fetchTrash();
                      fetchData();
                    } catch (err) {
                      notify.error("Failed to restore");
                    }
                  }}
                  className="text-green-600 hover:underline"
                >
                  Restore
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm("Permanently delete this file?")) return;
                    try {
                      await api.delete(`/files/file/permanent/${file.id}`);
                      notify.success("File permanently deleted");
                      fetchTrash();
                    } catch (err) {
                      notify.error("Failed to delete");
                    }
                  }}
                  className="text-red-600 hover:underline"
                >
                  Delete Permanently
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end mt-4">
        <button
          onClick={() => setTrashOpen(false)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
