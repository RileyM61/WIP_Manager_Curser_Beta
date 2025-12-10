import React, { useState, useEffect, useRef } from 'react';
import { Settings, WeekDay, JobStatus, UserRole } from '../../types';
import { XIcon } from '../shared/icons';
import ImageCropperModal from './ImageCropperModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [currentSettings, setCurrentSettings] = useState<Settings>(settings);
  const [newPm, setNewPm] = useState('');
  const [newEstimator, setNewEstimator] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'defaultRole') {
      setCurrentSettings(prev => ({ ...prev, defaultRole: value as UserRole }));
      return;
    }

    setCurrentSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPm = () => {
    if (newPm.trim() && !currentSettings.projectManagers.includes(newPm.trim())) {
      setCurrentSettings(prev => ({
        ...prev,
        projectManagers: [...prev.projectManagers, newPm.trim()].sort(),
      }));
      setNewPm('');
    }
  };

  const handleRemovePm = (pmToRemove: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      projectManagers: prev.projectManagers.filter(pm => pm !== pmToRemove),
    }));
  };

  const handleAddEstimator = () => {
    if (newEstimator.trim() && !currentSettings.estimators.includes(newEstimator.trim())) {
      setCurrentSettings(prev => ({
        ...prev,
        estimators: [...prev.estimators, newEstimator.trim()].sort(),
      }));
      setNewEstimator('');
    }
  };

  const handleRemoveEstimator = (estimatorToRemove: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      estimators: prev.estimators.filter(est => est !== estimatorToRemove),
    }));
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    // Ensure all settings including companyLogo are included
    const settingsToSave: Settings = {
      ...currentSettings,
      companyLogo: currentSettings.companyLogo || undefined,
    };
    onSave(settingsToSave);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageToCrop(event.target?.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
    // Reset file input to allow re-uploading the same file
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
    setCurrentSettings(prev => ({ ...prev, companyLogo: croppedImage }));
    setIsCropperOpen(false);
    setImageToCrop(null);
  };

  const handleRemoveLogo = () => {
    setCurrentSettings(prev => {
      const newSettings = { ...prev };
      delete newSettings.companyLogo;
      return newSettings;
    });
  }

  const weekDays: WeekDay[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleToggleCapacity = () => {
    setCurrentSettings(prev => {
      const nextEnabled = !prev.capacityEnabled;
      return {
        ...prev,
        capacityEnabled: nextEnabled,
        capacityPlan: nextEnabled ? prev.capacityPlan : undefined,
      };
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-xl max-h-full flex flex-col">
          <div className="p-6 border-b dark:border-gray-700 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Application Settings</h2>
              <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <XIcon />
              </button>
            </div>
          </div>

          <div className="flex-grow flex flex-col overflow-hidden">
            <div className="p-6 flex-grow overflow-y-auto space-y-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={currentSettings.companyName}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200"
                />
              </div>

              <div>
                <label htmlFor="defaultRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Role</label>
                <select
                  name="defaultRole"
                  id="defaultRole"
                  value={currentSettings.defaultRole}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="owner">Owner</option>
                  <option value="projectManager">Project Manager</option>
                </select>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Logo</h3>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="w-40 h-16 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-center border dark:border-gray-600 overflow-hidden">
                    {currentSettings.companyLogo ? (
                      <img src={currentSettings.companyLogo} alt="Company Logo Preview" className="h-full w-auto object-contain" />
                    ) : (
                      <span className="text-xs text-gray-400">No Logo</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white dark:bg-gray-600 dark:border-gray-500 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500"
                    >
                      Upload Logo
                    </button>
                    {currentSettings.companyLogo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-red-600 hover:text-red-800 text-sm font-medium ml-3"
                      >
                        Remove Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Managers</h3>
                <div className="mt-2 space-y-2">
                  {currentSettings.projectManagers.map(pm => (
                    <div key={pm} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{pm}</span>
                      <button type="button" onClick={() => handleRemovePm(pm)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newPm}
                    onChange={(e) => setNewPm(e.target.value)}
                    placeholder="Add new PM name"
                    className="flex-grow block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200"
                  />
                  <button type="button" onClick={handleAddPm} className="bg-gray-200 dark:bg-gray-600 dark:border-gray-500 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">Add</button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Estimators</h3>
                <div className="mt-2 space-y-2">
                  {currentSettings.estimators.map(estimator => (
                    <div key={estimator} className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/30 p-2 rounded-md">
                      <span className="text-sm text-gray-800 dark:text-gray-200">{estimator}</span>
                      <button type="button" onClick={() => handleRemoveEstimator(estimator)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                    </div>
                  ))}
                  {currentSettings.estimators.length === 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">No estimators added yet</p>
                  )}
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newEstimator}
                    onChange={(e) => setNewEstimator(e.target.value)}
                    placeholder="Add new Estimator name"
                    className="flex-grow block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200"
                  />
                  <button type="button" onClick={handleAddEstimator} className="bg-purple-100 dark:bg-purple-800 dark:border-purple-600 py-2 px-4 border border-purple-300 rounded-md text-sm font-medium text-purple-700 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-700">Add</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weekEndDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300">WIP Weekly End Day</label>
                  <select
                    name="weekEndDay"
                    id="weekEndDay"
                    value={currentSettings.weekEndDay}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200"
                  >
                    {weekDays.map(day => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="defaultStatus" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Status for New Jobs</label>
                  <select
                    name="defaultStatus"
                    id="defaultStatus"
                    value={currentSettings.defaultStatus}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-blue focus:border-brand-blue dark:bg-gray-700 dark:text-gray-200"
                  >
                    {Object.values(JobStatus).map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Staffing Capacity Tracking</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      When enabled, you can plan headcount and hours per discipline.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleCapacity}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${currentSettings.capacityEnabled ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 rounded-full bg-white transform transition ${currentSettings.capacityEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
                {!currentSettings.capacityEnabled && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Toggle this on to create a default capacity plan. You can edit the staffing disciplines later.
                  </p>
                )}
              </div>

            </div>

            <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 flex-shrink-0">
              <button type="button" onClick={onClose} className="bg-white dark:bg-gray-600 dark:border-gray-500 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-brand-blue py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-brand-blue/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      {isCropperOpen && imageToCrop && (
        <ImageCropperModal
          isOpen={isCropperOpen}
          onClose={() => setIsCropperOpen(false)}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};

export default SettingsModal;