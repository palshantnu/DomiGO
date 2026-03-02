import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import colors from '../../theme/colors';

const PropertyOwnershipForm = ({ data, onChange }) => {
    const updateField = (field, value) => {
        onChange({ ...data, [field]: value, enabled: true });
    };

    return (
        <View>
            <Text style={styles.label}>Do you own this property? *</Text>
            <View style={styles.yesNoContainer}>
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.owns === true && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('owns', true)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.owns === true && styles.yesNoTextActive
                    ]}>Yes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[
                        styles.yesNoButton,
                        data.owns === false && styles.yesNoButtonActive
                    ]}
                    onPress={() => updateField('owns', false)}
                >
                    <Text style={[
                        styles.yesNoText,
                        data.owns === false && styles.yesNoTextActive
                    ]}>No</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 12,
        color: "#333",
    },
    yesNoContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    yesNoButton: {
        flex: 1,
        paddingVertical: 14,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginRight: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    yesNoButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    yesNoText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    yesNoTextActive: {
        color: '#fff',
    },
});

export default PropertyOwnershipForm;