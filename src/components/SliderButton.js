import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, I18nManager, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { getThemeSelector } from '../redux/selectors/common';
import useTheme from '../theme/useTheme';



export const SliderButton = ({
    onSubmit,
    buttonTitle,
    iconName,
    iconColor,
    loader,
    isRTL = I18nManager.isRTL,
    isClickButton = true,
    activeOpacity = .8,
    btncolor = ''
}) => {
    const { Colors } = useTheme();
    const theme = useSelector(getThemeSelector);
    return (
        <View style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}>
            <TouchableOpacity
                activeOpacity={loader ? 1 : activeOpacity ? activeOpacity : 0.7}
                onPress={() => {
                    if (isClickButton && !loader) { onSubmit() }
                }}
                style={[styles.buttonCpntainer, {
                    borderColor: btncolor != '' ? "#69BE7E" : theme === 'theme1' ? Colors.APPTHEME : Colors.APPTHEME,
                    backgroundColor: btncolor != '' ? "#69BE7E" : theme === 'theme1' ? Colors.APPTHEME : Colors.APPTHEME,
                }]}>
                {loader ? (
                    <ActivityIndicator size={20} color={'#FFFFFF'} />
                ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View
                            style={[styles.emptyContainer, {
                                backgroundColor: !iconName ? "rgba(0, 0, 0, 0)" : theme == 'theme1' ? Colors.APPTHEME : Colors.LIGHT_APPTHEME,
                            }]}
                        >
                            <Icon name={iconName} size={20} color={iconColor || Colors.ICON_COLOR_WHITE}
                            /></View>
                        <Text style={[styles.buttonText, { color: Colors.TEXT_COLOR_WHITE, fontSize: 16 }]}>
                            {buttonTitle}
                        </Text>
                        <View style={styles.emptyContainer}></View>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    buttonText: {
        fontFamily: 'Figtree-Bold',
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.8,
        fontWeight: 'bold',
    },
    emptyContainer: {
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        width: 45,
        height: 45
    },
    buttonCpntainer: {
        justifyContent: 'center',
        width: '100%',
        alignSelf: 'center',
        height: 55,
        borderRadius: 25,
    }
});

