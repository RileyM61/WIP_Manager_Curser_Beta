import React, { useState, useRef } from 'react';
import { Settings } from '../../types';
import ImageCropperModal from '../modals/ImageCropperModal';

interface CompanySettingsProps {
  settings: Settings;
  onChange: (settings: Partial<Settings>) => void;
  onSave: () => void;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ settings, onChange, onSave }) => {
  const [newPm, setNewPm] = useState('');
  const [newEstimator, setNewEstimator] = useState('');
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
    setHasChanges(true);
  };

  const handleAddPm = () => {
    if (newPm.trim() && !settings.projectManagers.includes(newPm.trim())) {
      onChange({
        projectManagers: [...settings.projectManagers, newPm.trim()].sort(),
      });
      setNewPm('');
      setHasChanges(true);
    }
  };

  const handleRemovePm = (pmToRemove: string) => {
    onChange({
      projectManagers: settings.projectManagers.filter(pm => pm !== pmToRemove),
    });
    setHasChanges(true);
  };

  const handleAddEstimator = () => {
    if (newEstimator.trim() && !settings.estimators.includes(newEstimator.trim())) {
      onChange({
        estimators: [...settings.estimators, newEstimator.trim()].sort(),
      });
      setNewEstimator('');
      setHasChanges(true);
    }
  };

  const handleRemoveEstimator = (estimatorToRemove: string) => {
    onChange({
      estimators: settings.estimators.filter(est => est !== estimatorToRemove),
    });
    setHasChanges(true);
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
    e.target.value = '';
  };

  const handleCropComplete = (croppedImage: string) => {
    onChange({ companyLogo: croppedImage });
    setIsCropperOpen(false);
    setImageToCrop(null);
    setHasChanges(true);
  };

  const handleRemoveLogo = () => {
    onChange({ companyLogo: undefined });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave();
    setHasChanges(false);
  };

  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-1">Company Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your company profile and team members.
          </p>
        </div>

        {/* Company Name */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">Company Profile</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                value={settings.companyName}
                onChange={handleChange}
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-32 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600 overflow-hidden">
                  {settings.companyLogo ? (
                    <img src={settings.companyLogo} alt="Company Logo" className="h-full w-auto object-contain" />
                  ) : (
                    <span className="text-xs text-gray-400">No Logo</span>
                  )}
                </div>
                <div className="flex gap-2">
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
                    className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Upload Logo
                  </button>
                  {settings.companyLogo && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Managers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1">Project Managers</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add project managers that can be assigned to jobs.
          </p>
          
          <div className="space-y-2 mb-4">
            {settings.projectManagers.map(pm => (
              <div key={pm} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <span className="text-sm text-gray-800 dark:text-gray-200">{pm}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePm(pm)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
            {settings.projectManagers.length === 0 && (
              <p className="text-sm text-gray-400 italic">No project managers added yet</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newPm}
              onChange={(e) => setNewPm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPm()}
              placeholder="Add new PM name"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={handleAddPm}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Estimators */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1">Estimators</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add estimators that can be assigned to jobs.
          </p>
          
          <div className="space-y-2 mb-4">
            {settings.estimators.map(estimator => (
              <div key={estimator} className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                <span className="text-sm text-gray-800 dark:text-gray-200">{estimator}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEstimator(estimator)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
            {settings.estimators.length === 0 && (
              <p className="text-sm text-gray-400 italic">No estimators added yet</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <input
              type="text"
              value={newEstimator}
              onChange={(e) => setNewEstimator(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEstimator()}
              placeholder="Add new Estimator name"
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-gray-200"
            />
            <button
              type="button"
              onClick={handleAddEstimator}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
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

export default CompanySettings;

