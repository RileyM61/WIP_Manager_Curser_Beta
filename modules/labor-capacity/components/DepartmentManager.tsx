// ============================================================================
// DEPARTMENT MANAGER COMPONENT
// ============================================================================

import React, { useState } from 'react';
import { Department, DepartmentFormData } from '../types';

interface DepartmentManagerProps {
  departments: Department[];
  onCreate: (data: DepartmentFormData) => Promise<Department | null>;
  onUpdate: (id: string, data: Partial<DepartmentFormData>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onInitializeDefaults: () => Promise<boolean>;
}

const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  departments,
  onCreate,
  onUpdate,
  onDelete,
  onInitializeDefaults,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newIsProductive, setNewIsProductive] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!newName.trim()) return;

    setSaving(true);
    const result = await onCreate({
      name: newName.trim(),
      isProductive: newIsProductive,
      sortOrder: departments.length,
    });
    setSaving(false);

    if (result) {
      setNewName('');
      setNewIsProductive(true);
      setIsAdding(false);
    }
  };

  const handleUpdate = async (id: string, name: string, isProductive: boolean) => {
    setSaving(true);
    await onUpdate(id, { name, isProductive });
    setSaving(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department? Employees allocated to it will need to be reassigned.')) {
      return;
    }
    await onDelete(id);
  };

  const handleInitialize = async () => {
    if (departments.length > 0) {
      if (!confirm('This will add default departments. Existing departments will not be affected.')) {
        return;
      }
    }
    setSaving(true);
    await onInitializeDefaults();
    setSaving(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Departments
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Organize employees by department or location
          </p>
        </div>
        <div className="flex gap-2">
          {departments.length === 0 && (
            <button
              onClick={handleInitialize}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Load Defaults
            </button>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>
      </div>

      {/* Department List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30"
          >
            {editingId === dept.id ? (
              <EditRow
                department={dept}
                onSave={(name, isProductive) => handleUpdate(dept.id, name, isProductive)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${dept.isProductive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{dept.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dept.isProductive ? 'Productive (counts toward capacity)' : 'Non-productive'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(dept.id)}
                    className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Add New Row */}
        {isAdding && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10">
            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Department name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={newIsProductive}
                  onChange={(e) => setNewIsProductive(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                Productive
              </label>
              <button
                onClick={handleAdd}
                disabled={saving || !newName.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewName('');
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {departments.length === 0 && !isAdding && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No departments configured.</p>
            <p className="text-sm mt-1">Add departments or load defaults to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Edit Row Component
interface EditRowProps {
  department: Department;
  onSave: (name: string, isProductive: boolean) => void;
  onCancel: () => void;
  saving: boolean;
}

const EditRow: React.FC<EditRowProps> = ({ department, onSave, onCancel, saving }) => {
  const [name, setName] = useState(department.name);
  const [isProductive, setIsProductive] = useState(department.isProductive);

  return (
    <div className="flex items-center gap-4 w-full">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
        autoFocus
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={isProductive}
          onChange={(e) => setIsProductive(e.target.checked)}
          className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
        />
        Productive
      </label>
      <button
        onClick={() => onSave(name, isProductive)}
        disabled={saving || !name.trim()}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
      >
        Save
      </button>
      <button
        onClick={onCancel}
        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
      >
        Cancel
      </button>
    </div>
  );
};

export default DepartmentManager;

