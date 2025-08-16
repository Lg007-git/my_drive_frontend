import React,   { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [newName, setNewName] = useState("");

  const fetchFiles = async () => {
    try {
      const { data } = await api.get("/files");
      setFiles(Array.isArray(data) ? data : data.files || []);
    //   setFiles(data);
    } catch {
      toast.error("Failed to fetch files");
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post("/files/upload", formData);
      toast.success("File uploaded!");
      fetchFiles();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await api.delete(`/files/${id}`);
      toast.success("File deleted");
      fetchFiles();
    } catch {
      toast.error("Delete failed");
    }
  };

  const handleRename = async (id) => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await api.put(`/files/${id}`, { name: newName });
      toast.success("File renamed");
      setRenamingId(null);
      setNewName("");
      fetchFiles();
    } catch {
      toast.error("Rename failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Upload Box */}
      <div className="mb-6 border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center bg-white shadow">
        <input
          type="file"
          id="fileInput"
          onChange={handleUpload}
          className="hidden"
        />
        <label
          htmlFor="fileInput"
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {uploading ? "Uploading..." : "Upload File"}
        </label>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Your Files</h2>
        {files.length === 0 ? (
          <p className="text-gray-500">No files uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex justify-between items-center py-2"
              >
                {renamingId === file.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="border px-2 py-1 rounded"
                    />
                    <button
                      onClick={() => handleRename(file.id)}
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRenamingId(null)}
                      className="bg-gray-300 px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <span>{file.originalName}</span>
                )}

                <div className="flex gap-3">
                  <a
                    href={file.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Download
                  </a>
                  <button
                    onClick={() => {
                      setRenamingId(file.id);
                      setNewName(file.originalName);
                    }}
                    className="text-yellow-500"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
