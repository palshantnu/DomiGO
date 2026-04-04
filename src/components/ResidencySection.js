// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import colors from '../theme/colors';

// const ResidencySection = ({
//     title,
//     isEnabled,
//     onToggle,
//     onPress,
//     values,
//     children,
//     showToggle = true,
//     showAddMultiple = false,
//     onAddMultiple
// }) => {
//     return (
//         <TouchableOpacity 
//             style={[styles.sectionCard, isEnabled && styles.sectionCardEnabled]}
//             onPress={onPress}
//             activeOpacity={0.7}
//         >
//             <View style={styles.sectionHeader}>
//                 <View style={styles.titleContainer}>
//                     <Text style={styles.sectionTitle}>{title}</Text>
//                     {isEnabled && (
//                         <View style={styles.statusBadge}>
//                             <Text style={styles.statusText}>Added</Text>
//                         </View>
//                     )}
//                 </View>

//                 {showToggle && (
//                     <Switch
//                         trackColor={{ false: "#E0E0E0", true: colors.primary }}
//                         thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
//                         onValueChange={onToggle}
//                         value={isEnabled}
//                     />
//                 )}
//             </View>

//             {isEnabled && values && (
//                 <View style={styles.valuesContainer}>
//                     {Object.entries(values).map(([key, value]) => {
//                         if (value && typeof value !== 'object') {
//                             return (
//                                 <View key={key} style={styles.valueRow}>
//                                     <Text style={styles.valueLabel}>{key}:</Text>
//                                     <Text style={styles.valueText}>{value}</Text>
//                                 </View>
//                             );
//                         }
//                         return null;
//                     })}

//                     {values.document && (
//                         <View style={styles.valueRow}>
//                             <Ionicons name="document-attach" size={16} color={colors.primary} />
//                             <Text style={styles.documentText}>Document Attached</Text>
//                         </View>
//                     )}
//                 </View>
//             )}

//             {showAddMultiple && isEnabled && (
//                 <TouchableOpacity 
//                     style={styles.addMultipleButton}
//                     onPress={onAddMultiple}
//                 >
//                     <Ionicons name="add-circle" size={20} color={colors.primary} />
//                     <Text style={styles.addMultipleText}>Add Another</Text>
//                 </TouchableOpacity>
//             )}

//             {children}
//         </TouchableOpacity>
//     );
// };

// const styles = StyleSheet.create({
//     sectionCard: {
//         backgroundColor: '#fff',
//         borderRadius: 16,
//         padding: 16,
//         marginBottom: 12,
//         borderWidth: 1,
//         borderColor: '#F0F0F0',
//     },
//     sectionCardEnabled: {
//         borderColor: colors.primary,
//         borderWidth: 1.5,
//     },
//     sectionHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     titleContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         flex: 1,
//     },
//     sectionTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#333',
//     },
//     statusBadge: {
//         backgroundColor: '#E8F5E9',
//         paddingHorizontal: 8,
//         paddingVertical: 2,
//         borderRadius: 12,
//         marginLeft: 8,
//     },
//     statusText: {
//         fontSize: 11,
//         color: '#2E7D32',
//         fontWeight: '500',
//     },
//     valuesContainer: {
//         marginTop: 12,
//         paddingTop: 12,
//         borderTopWidth: 1,
//         borderTopColor: '#F0F0F0',
//     },
//     valueRow: {
//         flexDirection: 'row',
//         marginBottom: 6,
//     },
//     valueLabel: {
//         fontSize: 13,
//         color: '#666',
//         width: 100,
//     },
//     valueText: {
//         fontSize: 13,
//         color: '#333',
//         fontWeight: '500',
//         flex: 1,
//     },
//     documentText: {
//         fontSize: 13,
//         color: colors.primary,
//         marginLeft: 6,
//         fontWeight: '500',
//     },
//     addMultipleButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginTop: 12,
//         paddingTop: 12,
//         borderTopWidth: 1,
//         borderTopColor: '#F0F0F0',
//     },
//     addMultipleText: {
//         fontSize: 14,
//         color: colors.primary,
//         fontWeight: '600',
//         marginLeft: 8,
//     },
// });

// export default ResidencySection;
// components/ResidencySection.js
// import React from 'react';
// import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import colors from '../theme/colors';

// const ResidencySection = ({
//     title,
//     isEnabled,
//     onToggle,
//     onPress,
//     values,
//     children,
//     showToggle = true,
//     showAddMultiple = false,
//     onAddMultiple
// }) => {

//     // Format values for display
//     const getDisplayValues = () => {
//         if (!values) return null;

//         // Handle different data structures
//         const displayData = {};

//         if (values.date) displayData.Date = values.date;
//         if (values.issueDate) displayData['Issue Date'] = values.issueDate;
//         if (values.startDate) displayData['Start Date'] = values.startDate;
//         if (values.registrationDate) displayData['Registration Date'] = values.registrationDate;
//         if (values.lastFileDate) displayData['Last File Date'] = values.lastFileDate;
//         if (values.dateEstablished) displayData['Date Established'] = values.dateEstablished;
//         if (values.state) displayData.State = values.state;
//         if (values.city) displayData.City = values.city;
//         if (values.county) displayData.County = values.county;
//         if (values.address) displayData.Address = values.address;
//         if (values.number) displayData['License No'] = values.number;
//         if (values.regNumber) displayData['Reg No'] = values.regNumber;
//         if (values.name) displayData['Business Name'] = values.name;
//         if (values.type) displayData.Type = values.type;
//         if (values.owns !== undefined) displayData.Owner = values.owns ? 'Yes' : 'No';
//         if (values.exemptions !== undefined) displayData.Exemptions = values.exemptions ? 'Yes' : 'No';

//         return displayData;
//     };

//     const displayValues = getDisplayValues();

//     return (
//         <TouchableOpacity 
//             style={[styles.sectionCard, isEnabled && styles.sectionCardEnabled]}
//             onPress={onPress}
//             activeOpacity={0.7}
//         >
//             <View style={styles.sectionHeader}>
//                 <View style={styles.titleContainer}>
//                     <Text style={styles.sectionTitle}>{title}</Text>
//                     {isEnabled && (
//                         <View style={styles.statusBadge}>
//                             <Text style={styles.statusText}>Added</Text>
//                         </View>
//                     )}
//                 </View>

//                 {showToggle && (
//                     <Switch
//                         trackColor={{ false: "#E0E0E0", true: colors.primary }}
//                         thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
//                         onValueChange={onToggle}
//                         value={isEnabled}
//                     />
//                 )}
//             </View>

//             {isEnabled && displayValues && Object.keys(displayValues).length > 0 && (
//                 <View style={styles.valuesContainer}>
//                     {Object.entries(displayValues).map(([key, value]) => (
//                         <View key={key} style={styles.valueRow}>
//                             <Text style={styles.valueLabel}>{key}:</Text>
//                             <Text style={styles.valueText} numberOfLines={1}>{value}</Text>
//                         </View>
//                     ))}

//                     {values.document && (
//                         <View style={styles.valueRow}>
//                             <Ionicons name="document-attach" size={16} color={colors.primary} />
//                             <Text style={styles.documentText}>Document Attached</Text>
//                         </View>
//                     )}
//                 </View>
//             )}

//             {showAddMultiple && isEnabled && (
//                 <TouchableOpacity 
//                     style={styles.addMultipleButton}
//                     onPress={onAddMultiple}
//                 >
//                     <Ionicons name="add-circle" size={20} color={colors.primary} />
//                     <Text style={styles.addMultipleText}>Add Another</Text>
//                 </TouchableOpacity>
//             )}

//             {children}
//         </TouchableOpacity>
//     );
// };

// const styles = StyleSheet.create({
//     sectionCard: {
//         backgroundColor: '#fff',
//         borderRadius: 16,
//         padding: 16,
//         marginHorizontal: 16,
//         marginBottom: 12,
//         borderWidth: 1,
//         borderColor: '#F0F0F0',
//     },
//     sectionCardEnabled: {
//         borderColor: colors.primary,
//         borderWidth: 1.5,
//     },
//     sectionHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//     },
//     titleContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         flex: 1,
//     },
//     sectionTitle: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#333',
//     },
//     statusBadge: {
//         backgroundColor: '#E8F5E9',
//         paddingHorizontal: 8,
//         paddingVertical: 2,
//         borderRadius: 12,
//         marginLeft: 8,
//     },
//     statusText: {
//         fontSize: 11,
//         color: '#2E7D32',
//         fontWeight: '500',
//     },
//     valuesContainer: {
//         marginTop: 12,
//         paddingTop: 12,
//         borderTopWidth: 1,
//         borderTopColor: '#F0F0F0',
//     },
//     valueRow: {
//         flexDirection: 'row',
//         marginBottom: 6,
//     },
//     valueLabel: {
//         fontSize: 13,
//         color: '#666',
//         width: 100,
//     },
//     valueText: {
//         fontSize: 13,
//         color: '#333',
//         fontWeight: '500',
//         flex: 1,
//     },
//     documentText: {
//         fontSize: 13,
//         color: colors.primary,
//         marginLeft: 6,
//         fontWeight: '500',
//     },
//     addMultipleButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginTop: 12,
//         paddingTop: 12,
//         borderTopWidth: 1,
//         borderTopColor: '#F0F0F0',
//     },
//     addMultipleText: {
//         fontSize: 14,
//         color: colors.primary,
//         fontWeight: '600',
//         marginLeft: 8,
//     },
// });

// export default ResidencySection;
// components/ResidencySection.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Linking } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

const ResidencySection = ({
    title,
    isEnabled,
    onToggle,
    onPress,
    values,
    children,
    showToggle = true,
    showAddMultiple = false,
    onAddMultiple
}) => {

    // Format values for display based on category
    const getDisplayValues = () => {
        if (!values || !isEnabled) return null;

        const displayData = [];

        // Handle different data structures from API
        if (values.metadata) {
            // If metadata exists, use it
            const metadata = typeof values.metadata === 'string'
                ? JSON.parse(values.metadata)
                : values.metadata;

            if (metadata) {
                Object.entries(metadata).forEach(([key, value]) => {
                    if (value && typeof value !== 'object') {
                        const label = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, str => str.toUpperCase());
                        displayData.push({ label, value });
                    }
                });
            }
        } else {
            // Direct values from the object
            if (values.issueDate) displayData.push({
                label: 'Issue Date',
                value: new Date(values.issueDate).toLocaleDateString()
            });
            if (values.renewDate) displayData.push({
                label: 'Renew Date',
                value: new Date(values.renewDate).toLocaleDateString()
            });
            if (values.state) displayData.push({ label: 'State', value: values.state });
            if (values.city) displayData.push({ label: 'City', value: values.city });
            if (values.number) displayData.push({ label: 'License No', value: values.number });
            if (values.regNumber) displayData.push({ label: 'Reg No', value: values.regNumber });
            if (values.name) displayData.push({ label: 'Business Name', value: values.name });
            if (values.type) displayData.push({ label: 'Type', value: values.type });
            if (values.details) displayData.push({ label: 'Details', value: values.details });
        }

        // Add document info
        if (values.attachmentUrl) {
            displayData.push({
                label: 'Document',
                value: '📎 Attached',
                isDocument: true
            });
        }

        return displayData;
    };

    // const openAttachment = (url) => {
    //     if (url) {
    //         Linking.openURL(url).catch(err => {
    //             console.log("Error opening file:", err);
    //         });
    //     }
    // };
    const openAttachment = async (url) => {
        try {
            if (!url) return;

            // ✅ remove query params
            const cleanUrl = url.split('?')[0];
    
            const fileName = cleanUrl.split('/').pop();
            const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    
            // ✅ check if file already exists
            const fileExists = await RNFS.exists(localPath);
    
            if (!fileExists) {
                console.log("Downloading file...");
    
                const download = await RNFS.downloadFile({
                    fromUrl: url,
                    toFile: localPath,
                }).promise;
    
                if (download.statusCode !== 200) {
                    console.log("Download failed");
                    return;
                }
            } else {
                console.log("File already exists, opening directly...");
            }
    
            // ✅ open file
            await FileViewer.open(localPath);
    
        } catch (error) {
            console.log("Error:", error);
        }
    };

    const displayValues = getDisplayValues();

    return (
        <TouchableOpacity
            style={[styles.sectionCard, isEnabled && styles.sectionCardEnabled]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.sectionHeader}>
                <View style={styles.titleContainer}>
                    <Text style={styles.sectionTitle}>{title}</Text>
                    {isEnabled && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Added</Text>
                        </View>
                    )}
                </View>

                {showToggle && (
                    <Switch
                        trackColor={{ false: "#E0E0E0", true: colors.primary }}
                        thumbColor={isEnabled ? "#fff" : "#f4f3f4"}
                        onValueChange={onToggle}
                        value={isEnabled}
                    />
                )}
            </View>

            {isEnabled && displayValues && displayValues.length > 0 && (
                <View style={styles.valuesContainer}>
                    {displayValues.map((item, index) => (
                        <View key={index} style={styles.valueRow}>
                            <Text style={styles.valueLabel}>{item.label}:</Text>
                            {/* <Text style={styles.valueText} numberOfLines={1}>
                                {item.value}
                            </Text> */}
                            {item.isDocument ? (
                                <TouchableOpacity onPress={() => openAttachment(values.attachmentUrl)}>
                                    <Text style={[styles.valueText, { color: colors.primary }]}>
                                        {item.value}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.valueText} numberOfLines={1}>
                                    {item.value}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>
            )}

            {showAddMultiple && isEnabled && (
                <TouchableOpacity
                    style={styles.addMultipleButton}
                    onPress={onAddMultiple}
                >
                    <Ionicons name="add-circle" size={20} color={colors.primary} />
                    <Text style={styles.addMultipleText}>Add Another</Text>
                </TouchableOpacity>
            )}

            {children}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    sectionCardEnabled: {
        borderColor: colors.primary,
        borderWidth: 1.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 11,
        color: '#2E7D32',
        fontWeight: '500',
    },
    valuesContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    valueRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    valueLabel: {
        fontSize: 13,
        color: '#666',
        width: 100,
    },
    valueText: {
        fontSize: 13,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    addMultipleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    addMultipleText: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default ResidencySection;