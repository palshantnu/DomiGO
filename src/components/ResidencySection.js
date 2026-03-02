import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

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

            {isEnabled && values && (
                <View style={styles.valuesContainer}>
                    {Object.entries(values).map(([key, value]) => {
                        if (value && typeof value !== 'object') {
                            return (
                                <View key={key} style={styles.valueRow}>
                                    <Text style={styles.valueLabel}>{key}:</Text>
                                    <Text style={styles.valueText}>{value}</Text>
                                </View>
                            );
                        }
                        return null;
                    })}
                    
                    {values.document && (
                        <View style={styles.valueRow}>
                            <Ionicons name="document-attach" size={16} color={colors.primary} />
                            <Text style={styles.documentText}>Document Attached</Text>
                        </View>
                    )}
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
        marginBottom: 6,
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
    documentText: {
        fontSize: 13,
        color: colors.primary,
        marginLeft: 6,
        fontWeight: '500',
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