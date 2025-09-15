'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../../../lib/supabase/client'; // Assuming this path is correct now
import { checkFileExists } from '../../../../../lib/supabase/utils';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip'; // For displaying filenames/status
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Icon for uploaded status
import CancelIcon from '@mui/icons-material/Cancel'; // Icon for not uploaded status
import Tooltip from '@mui/material/Tooltip';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // Import Download Icon
import DownloadIcon from '@mui/icons-material/Download'; // Import Download Icon for zip
import Snackbar from '@mui/material/Snackbar';
import Menu from '@mui/material/Menu'; // For multi-download dropdown
import MenuItem from '@mui/material/MenuItem'; // For multi-download dropdown
import JSZip from 'jszip'; // Import JSZip for zipping files

const BUCKET_NAME = 'lead-documents'; // Updated bucket name

interface LeadDocumentsSectionProps {
    leadId: string;
}

// Interface for document metadata from DB
interface LeadDocumentMetadata {
    id: string;
    document_type: string;
    file_name: string | null; // Filename might be null
    created_at: string;
    storage_object_path: string; // Added storage path
    exists?: boolean; // Flag to indicate if file exists in storage
}

// Define document types as per PRD 3.3
const DOCUMENT_TYPES = [
    'PAN', 'AADHAR FRONT', 'AADHAR BACK', 'PHOTO',
    'OTHER ADDR PROOF',
    'GST', 'SAL SLIP',
    'BANK STATEMENT', 'ID CARD', 'FORM 16', 'OTHER DOC'
];

// Types that allow multiple uploads
const MULTI_UPLOAD_TYPES = new Set(['SAL SLIP', 'BANK STATEMENT', 'OTHER DOC']);

// Fetch function for document metadata
async function fetchLeadDocumentsMetadata(leadId: string): Promise<LeadDocumentMetadata[]> {
    // Check authentication before querying
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || user.id === 'undefined' || user.id === 'null') {
        throw new Error("User not authenticated. Please refresh the page and try again.");
    }

    const { data, error } = await supabase
        .from('lead_documents')
        .select('id, document_type, file_name, created_at, storage_object_path') // Added storage_object_path
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false }); // Order by date if needed

    if (error) {
        console.error('Error fetching document metadata:', error);
        throw new Error('Failed to fetch document metadata.');
    }
    return data || [];
}

// Function to delete document metadata from the database
async function deleteDocumentMetadata(documentId: string): Promise<void> {
    // Check authentication before deleting
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || user.id === 'undefined' || user.id === 'null') {
        throw new Error("User not authenticated. Please refresh the page and try again.");
    }

    const { error } = await supabase
        .from('lead_documents')
        .delete()
        .eq('id', documentId);

    if (error) {
        console.error('Error deleting document metadata:', error);
        throw new Error(`Failed to delete document metadata: ${error.message}`);
    }
}

interface DocumentTypeCardProps {
    typeName: string;
    documents: LeadDocumentMetadata[];
    onUploadClick: (typeName: string) => void; // Callback to trigger file input
    onDownloadClick: (path: string, fileName: string | null) => void; // Callback for download
    isUploading: boolean; // To disable button during any upload
    isDownloading: boolean; // For download loading state
}

// Card component updated with Upload and Download buttons
function DocumentTypeCard({
    typeName,
    documents,
    onUploadClick,
    onDownloadClick,
    isUploading,
    isDownloading
}: DocumentTypeCardProps) {
    const isMulti = MULTI_UPLOAD_TYPES.has(typeName);
    const hasDocuments = documents.length > 0;
    const canUpload = isMulti || !hasDocuments;

    // State for multi-download menu
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const openMenu = Boolean(anchorEl);
    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleMenuItemClick = (path: string, fileName: string | null) => {
        onDownloadClick(path, fileName);
        handleMenuClose();
    };

    return (
        <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" component="div" gutterBottom>
                    {typeName}
                </Typography>
                {/* Status Indicator */}
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {hasDocuments ? (
                        isMulti ? (
                            // Show count for multi-upload types
                            <Chip
                                icon={<CheckCircleIcon />}
                                label={`${documents.length} file(s) uploaded`}
                                size="small"
                                color="success"
                                variant="outlined"
                            />
                            // Optionally list filenames if needed, could get long
                            // documents.map(doc => (
                            //     <Tooltip title={doc.file_name || 'Unnamed file'} key={doc.id}>
                            //         <Chip label={doc.file_name ? (doc.file_name.length > 15 ? doc.file_name.substring(0, 12) + '...' : doc.file_name) : 'Uploaded'} size="small" />
                            //     </Tooltip>
                            // ))
                        ) : (
                            // Show generic "Uploaded" for single-upload types
                             <Tooltip title={documents[0].file_name || 'Uploaded file'}>
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={'Uploaded'}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ maxWidth: '100%' }} // Prevent overflow
                                />
                            </Tooltip>
                        )
                    ) : (
                        <Chip
                            icon={<CancelIcon />}
                            label="Not Uploaded"
                            size="small"
                            color="default"
                            variant="outlined"
                        />
                    )}
                </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', pt: 0, flexWrap: 'wrap' }}>
                {/* Download Button/Menu */}
                {hasDocuments && (
                    isMulti ? (
                        <>
                            <Button
                                size="small"
                                startIcon={isDownloading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                                onClick={handleMenuClick}
                                disabled={isDownloading}
                                aria-controls={openMenu ? 'download-menu-' + typeName : undefined}
                                aria-haspopup="true"
                                aria-expanded={openMenu ? 'true' : undefined}
                            >
                                Download
                            </Button>
                            <Menu
                                id={'download-menu-' + typeName}
                                anchorEl={anchorEl}
                                open={openMenu}
                                onClose={handleMenuClose}
                                MenuListProps={{
                                    'aria-labelledby': 'basic-button',
                                }}
                            >
                                {documents.map(doc => (
                                     <MenuItem
                                        key={doc.id}
                                        onClick={() => handleMenuItemClick(doc.storage_object_path, doc.file_name)}
                                    >
                                        {doc.file_name || `Document ${doc.id.substring(0, 6)}`}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </>
                    ) : (
                        <Button
                            size="small"
                            startIcon={isDownloading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                            onClick={() => onDownloadClick(documents[0].storage_object_path, documents[0].file_name)}
                            disabled={isDownloading}
                        >
                            Download
                        </Button>
                    )
                )}
                {/* Upload Button - Keep it on the right */}
                <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'flex-end' }}>
                     {canUpload && (
                        <Button
                            size="small"
                            startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                            onClick={() => onUploadClick(typeName)}
                            disabled={isUploading}
                        >
                             {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    )}
                </Box>
            </CardActions>
        </Card>
    );
}

// --- Upload Mutation Function --- //
interface UploadAndRecordPayload {
    leadId: string;
    documentType: string;
    file: File;
}

interface BatchUploadPayload {
    leadId: string;
    documentType: string;
    files: File[];
}

interface RpcResponse {
    success: boolean;
    error?: string;
    document_id?: string;
}

// Define interface for RPC parameters
interface HandleDocumentUploadParams {
    p_lead_id: string;
    p_document_type: string;
    p_file_name: string;
    p_storage_path: string;
}

async function uploadAndRecordDocument({ leadId, documentType, file }: UploadAndRecordPayload): Promise<RpcResponse> {
    if (!file) throw new Error("No file selected.");

    // Check authentication before proceeding
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id || user.id === 'undefined' || user.id === 'null') {
        throw new Error("User not authenticated. Please refresh the page and try again.");
    }

    const fileExt = file.name.split('.').pop();
    const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storagePath = `${leadId}/${documentType}/${uniqueFileName}`; // Using nested structure

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file);

    if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    if (!uploadData?.path) {
         console.error('Storage upload succeeded but path is missing:', uploadData);
         throw new Error('Storage upload succeeded but path was not returned.');
    }
    const recordedStoragePath = uploadData.path;

    console.log('Calling RPC handle_document_upload with:', { p_lead_id: leadId, p_document_type: documentType, p_file_name: file.name, p_storage_path: recordedStoragePath });

    // Add retry logic for RPC calls to handle transient authentication issues
    let retryCount = 0;
    const maxRetries = 2;
    let rpcData, rpcError;

    while (retryCount <= maxRetries) {
        const result = await supabase.rpc<
            'handle_document_upload', // Function name as string literal type
            { Args: HandleDocumentUploadParams; Returns: RpcResponse } // Args and expected Returns structure
        >(
            'handle_document_upload', // Function name argument
            { p_lead_id: leadId, p_document_type: documentType, p_file_name: file.name, p_storage_path: recordedStoragePath } // Parameters argument
        );
        
        rpcData = result.data;
        rpcError = result.error;
        
        if (!rpcError) break;
        
        retryCount++;
        if (retryCount <= maxRetries) {
            console.warn(`Document upload RPC failed (attempt ${retryCount}), retrying...`, rpcError);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Progressive delay
        }
    }

    if (rpcError) {
        console.error('RPC Error after retries:', rpcError);
        throw new Error(`Failed to record document metadata: ${rpcError.message}`);
    }
     console.log('RPC Response:', rpcData);

     if (typeof rpcData !== 'object' || rpcData === null || typeof rpcData.success !== 'boolean') {
        console.error('Unexpected RPC response format:', rpcData);
        throw new Error('Unexpected format received from document recording function.');
    }
    if (!rpcData.success) {
        throw new Error(rpcData.error || 'Failed to record document in database.');
    }
    return rpcData;
}

// Function to handle batch upload of multiple files
async function batchUploadAndRecordDocuments({ leadId, documentType, files }: BatchUploadPayload): Promise<RpcResponse[]> {
    if (!files || files.length === 0) throw new Error("No files selected.");

    const results: RpcResponse[] = [];
    const maxSize = 15 * 1024 * 1024; // 15 MB

    // Process each file sequentially to avoid overwhelming the server
    for (const file of files) {
        try {
            // Check file size
            if (file.size > maxSize) {
                results.push({
                    success: false,
                    error: `File "${file.name}" exceeds the size limit of 15MB.`
                });
                continue;
            }

            // Upload and record the document
            const result = await uploadAndRecordDocument({ leadId, documentType, file });
            results.push(result);
        } catch (error) {
            console.error(`Error uploading file "${file.name}":`, error);
            results.push({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during upload'
            });
        }
    }

    return results;
}
// --- Component --- //
export function LeadDocumentsSection({ leadId }: LeadDocumentsSectionProps) {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
    const [isDownloading, setIsDownloading] = useState(false); // State for download loading
    const [isZipping, setIsZipping] = useState(false); // State for zip download loading
    const [downloadError, setDownloadError] = useState<string | null>(null); // State for download error
    const [validatedDocuments, setValidatedDocuments] = useState<LeadDocumentMetadata[]>([]);
    const [isValidating, setIsValidating] = useState(false);

    // Fetch Query with authentication optimization
    const { data: documentsMetadata, isLoading, error, isError } = useQuery<LeadDocumentMetadata[], Error>({
        queryKey: ['leadDocuments', leadId],
        queryFn: () => fetchLeadDocumentsMetadata(leadId),
        staleTime: 30 * 1000, // 30 seconds
        retry: (failureCount, error) => {
            // Don't retry authentication errors
            if (error.message.includes('not authenticated')) {
                return false;
            }
            return failureCount < 2;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Exponential backoff
    });

    // Delete Document Metadata Mutation
    const deleteMetadataMutation = useMutation({
        mutationFn: deleteDocumentMetadata,
        onSuccess: () => {
            // No need to invalidate queries as we're handling the state locally
            console.log('Document metadata deleted successfully');
        },
        onError: (error: Error) => {
            console.error('Failed to delete document metadata:', error);
            // We don't show this error to the user as it's a background cleanup operation
        }
    });

    // Validate document existence in storage and clean up orphaned records
    useEffect(() => {
        const validateDocuments = async () => {
            if (!documentsMetadata || documentsMetadata.length === 0) {
                setValidatedDocuments([]);
                return;
            }

            setIsValidating(true);

            try {
                const validatedDocs = await Promise.all(
                    documentsMetadata.map(async (doc) => {
                        const exists = await checkFileExists(supabase, BUCKET_NAME, doc.storage_object_path);
                        return { ...doc, exists };
                    })
                );

                // Filter out documents that don't exist in storage
                const existingDocs = validatedDocs.filter(doc => doc.exists);

                // If any documents were filtered out (don't exist in storage), log it and clean up the database
                const missingDocs = validatedDocs.filter(doc => !doc.exists);
                if (missingDocs.length > 0) {
                    console.warn(`${missingDocs.length} documents were found in the database but not in storage:`,
                        missingDocs.map(d => ({ id: d.id, path: d.storage_object_path })));

                    // Clean up orphaned records from the database
                    let cleanedUpCount = 0;
                    for (const doc of missingDocs) {
                        try {
                            await deleteMetadataMutation.mutateAsync(doc.id);
                            console.log(`Deleted orphaned document metadata for ID: ${doc.id}`);
                            cleanedUpCount++;
                        } catch (error) {
                            console.error(`Failed to delete orphaned document metadata for ID: ${doc.id}`, error);
                        }
                    }

                    // Notify the user that orphaned records were cleaned up
                    if (cleanedUpCount > 0) {
                        setSnackbarMessage(`${cleanedUpCount} document record(s) were cleaned up because the files were deleted from storage.`);
                        setSnackbarSeverity('info');
                        setSnackbarOpen(true);

                        // Invalidate the query to refresh the document list
                        queryClient.invalidateQueries({ queryKey: ['leadDocuments', leadId] });
                    }
                }

                setValidatedDocuments(existingDocs);
            } catch (err) {
                console.error('Error validating document existence:', err);
                // Fall back to showing all documents if validation fails
                setValidatedDocuments(documentsMetadata);
            } finally {
                setIsValidating(false);
            }
        };

        validateDocuments();
    }, [documentsMetadata, queryClient, leadId]);

    // Single file upload mutation
    const uploadMutation = useMutation<RpcResponse, Error, UploadAndRecordPayload>({
        mutationFn: uploadAndRecordDocument,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leadDocuments', leadId] });
            setSnackbarMessage('Document uploaded successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        },
        onError: (error) => {
            let errorMessage = `Upload failed: ${error.message}`;
            if (error.message.includes('not authenticated')) {
                errorMessage = 'Please refresh the page and try again. Your session may have expired.';
            } else if (error.message.includes('Permission denied')) {
                errorMessage = 'You do not have permission to upload documents for this lead.';
            }
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        },
        onSettled: () => {
            setSelectedDocType(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset file input
            }
        }
    });

    // Batch upload mutation for multiple files
    const batchUploadMutation = useMutation<RpcResponse[], Error, BatchUploadPayload>({
        mutationFn: batchUploadAndRecordDocuments,
        onSuccess: (results) => {
            queryClient.invalidateQueries({ queryKey: ['leadDocuments', leadId] });

            // Count successful and failed uploads
            const successCount = results.filter(r => r.success).length;
            const failedCount = results.length - successCount;

            if (failedCount === 0) {
                setSnackbarMessage(`Successfully uploaded ${successCount} document${successCount !== 1 ? 's' : ''}!`);
                setSnackbarSeverity('success');
            } else if (successCount === 0) {
                setSnackbarMessage('Failed to upload any documents. Please try again.');
                setSnackbarSeverity('error');
            } else {
                setSnackbarMessage(`Uploaded ${successCount} document${successCount !== 1 ? 's' : ''} successfully, ${failedCount} failed.`);
                setSnackbarSeverity('warning');
            }
            setSnackbarOpen(true);
        },
        onError: (error) => {
            let errorMessage = `Upload failed: ${error.message}`;
            if (error.message.includes('not authenticated')) {
                errorMessage = 'Please refresh the page and try again. Your session may have expired.';
            } else if (error.message.includes('Permission denied')) {
                errorMessage = 'You do not have permission to upload documents for this lead.';
            }
            setSnackbarMessage(errorMessage);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        },
        onSettled: () => {
            setSelectedDocType(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset file input
            }
        }
    });

    // Process data for cards - use validatedDocuments instead of documentsMetadata
    const documentsByType = useMemo(() => {
        const map = new Map<string, LeadDocumentMetadata[]>();
        validatedDocuments.forEach(doc => {
            const list = map.get(doc.document_type) || [];
            list.push(doc);
            map.set(doc.document_type, list);
        });
        return map;
     }, [validatedDocuments]);

    // Trigger hidden file input
    const handleUploadClick = (typeName: string) => {
        setSelectedDocType(typeName);
        fileInputRef.current?.click();
    };

    // Handle file selection and trigger mutation
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0 || !selectedDocType) {
            setSelectedDocType(null);
            return;
        }

        // Convert FileList to array
        const fileArray = Array.from(files);

        // Check if we're dealing with multiple files
        if (fileArray.length > 1) {
            // Use batch upload for multiple files
            batchUploadMutation.mutate({
                leadId,
                documentType: selectedDocType,
                files: fileArray
            });
        } else {
            // Use single file upload for just one file
            const file = fileArray[0];
            const maxSize = 15 * 1024 * 1024; // 15 MB

            if (file.size > maxSize) {
                setSnackbarMessage(`File size exceeds the limit of 15MB.`);
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setSelectedDocType(null);
                return;
            }

            uploadMutation.mutate({
                leadId,
                documentType: selectedDocType,
                file
            });
        }
    };

    // Handle Download Click
    const handleDownload = async (path: string, fileName: string | null) => {
        setIsDownloading(true);
        setDownloadError(null);
        try {
            // PRD 7: Verify user has access using can_user_access_lead
            // This check *should* ideally happen on the backend via storage policies
            // or a dedicated download function for stronger security.
            // Assuming policies are set correctly, we proceed.

            const { data, error: urlError } = await supabase.storage
                .from(BUCKET_NAME)
                .createSignedUrl(path, 60); // 60 seconds validity

            if (urlError) {
                throw urlError;
            }

            if (data?.signedUrl) {
                // Use our download API endpoint to force download instead of opening in a new tab
                const downloadUrl = `/api/documents/download-file?url=${encodeURIComponent(data.signedUrl)}&fileName=${encodeURIComponent(fileName || 'download')}`;

                // Create an invisible iframe to trigger the download
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = downloadUrl;
                document.body.appendChild(iframe);

                // Remove the iframe after a delay
                setTimeout(() => {
                    if (iframe && iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                    }
                }, 5000);

                console.log('Download initiated for:', fileName);
            } else {
                throw new Error('Could not retrieve download URL.');
            }
        } catch (err: unknown) { // <-- Use unknown instead of any
            console.error("Download error:", err);
            // Type guard to safely access error properties
            let message = 'Failed to generate download link.';
            if (err instanceof Error) {
                message = err.message;
            }
            setDownloadError(message); // Show specific download error
            setSnackbarMessage(`Download failed: ${message}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setIsDownloading(false);
        }
    };

    // Handle Download All Documents as Zip
    const handleDownloadAllDocs = async () => {
        if (!validatedDocuments || validatedDocuments.length === 0) {
            setSnackbarMessage('No documents available to download.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        setIsZipping(true);
        setDownloadError(null);

        try {
            const zip = new JSZip();
            const promises: Promise<void>[] = [];

            // Process each document directly without creating folders
            for (const doc of validatedDocuments) {
                const promise = (async () => {
                    try {
                        // Get signed URL for the document
                        const { data, error: urlError } = await supabase.storage
                            .from(BUCKET_NAME)
                            .createSignedUrl(doc.storage_object_path, 60);

                        if (urlError) {
                            console.error(`Error getting signed URL for ${doc.file_name}:`, urlError);
                            return;
                        }

                        if (!data?.signedUrl) {
                            console.error(`No signed URL returned for ${doc.file_name}`);
                            return;
                        }

                        // Fetch the file content
                        const response = await fetch(data.signedUrl);
                        if (!response.ok) {
                            console.error(`Failed to fetch ${doc.file_name}: ${response.statusText}`);
                            return;
                        }

                        const blob = await response.blob();

                        // Add file directly to the zip root with document type prefix to avoid conflicts
                        const fileName = doc.file_name || `document_${doc.id.substring(0, 6)}`;
                        const uniqueFileName = `${doc.document_type}_${fileName}`;
                        zip.file(uniqueFileName, blob);
                    } catch (err) {
                        console.error(`Error processing ${doc.file_name}:`, err);
                    }
                })();

                promises.push(promise);
            }

            // Wait for all promises to resolve
            await Promise.all(promises);

            // Generate the zip file
            const content = await zip.generateAsync({ type: 'blob' });

            // Create download link
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `Lead_${leadId}_Documents.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSnackbarMessage('All documents downloaded successfully!');
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
        } catch (err: unknown) {
            console.error("Zip download error:", err);
            let message = 'Failed to create zip file.';
            if (err instanceof Error) {
                message = err.message;
            }
            setDownloadError(message);
            setSnackbarMessage(`Download failed: ${message}`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } finally {
            setIsZipping(false);
        }
    };

     const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') return;
        setSnackbarOpen(false);
    };

    return (
        <Paper elevation={2} sx={{ mt: 4, p: 3 }}>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                    Document Management
                </Typography>
                {validatedDocuments && validatedDocuments.length > 0 && (
                    <Button
                        variant="outlined"
                        startIcon={isZipping ? <CircularProgress size={20} /> : <DownloadIcon />}
                        onClick={handleDownloadAllDocs}
                        disabled={isZipping || isDownloading}
                        size="small"
                    >
                        {isZipping ? 'Preparing Zip...' : 'Download All Docs'}
                    </Button>
                )}
            </Box>
            <Divider sx={{ mb: 3 }} />

            {(isLoading || isValidating) && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                    {isValidating && !isLoading && (
                        <Typography variant="body2" sx={{ ml: 2 }}>
                            Verifying document availability...
                        </Typography>
                    )}
                </Box>
            )}
            {isError && (
                <Alert severity="error" sx={{ my: 2 }}>
                    Error loading documents: {error?.message}
                </Alert>
            )}
            {downloadError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDownloadError(null)}>
                    Download Error: {downloadError}
                </Alert>
            )}
            {!isLoading && !isValidating && !isError && (
                <Grid container spacing={2}>
                    {DOCUMENT_TYPES.map((docType) => (
                        <Grid item xs={12} sm={6} md={4} key={docType}>
                            <DocumentTypeCard
                                typeName={docType}
                                documents={documentsByType.get(docType) || []}
                                onUploadClick={handleUploadClick}
                                onDownloadClick={handleDownload}
                                isUploading={(uploadMutation.isPending && uploadMutation.variables?.documentType === docType) ||
                                              (batchUploadMutation.isPending && batchUploadMutation.variables?.documentType === docType)}
                                isDownloading={isDownloading}
                             />
                        </Grid>
                    ))}
                </Grid>
            )}

             <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
}