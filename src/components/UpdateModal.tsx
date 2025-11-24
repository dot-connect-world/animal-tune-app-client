import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RFValue, RHValue } from '../utils/responsive';

interface UpdateModalProps {
  visible: boolean;
  forceUpdate: boolean;
  storeUrl: string;
  onClose: () => void;
}

export default function UpdateModal({
  visible,
  forceUpdate,
  storeUrl,
  onClose,
}: UpdateModalProps) {
  const { t } = useTranslation();

  const handleUpdate = async () => {
    try {
      const canOpen = await Linking.canOpenURL(storeUrl);
      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        console.error('Cannot open store URL:', storeUrl);
      }
    } catch (error) {
      console.error('Failed to open store:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={forceUpdate ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* 제목 */}
          <Text style={styles.title}>
            {forceUpdate ? t('update.forceTitle', '업데이트 필요') : t('update.title', '업데이트 안내')}
          </Text>

          {/* 메시지 */}
          <Text style={styles.message}>
            {forceUpdate
              ? t('update.forceMessage', '필수 업데이트가 필요합니다.\n앱을 계속 사용하려면 최신 버전으로 업데이트해 주세요.')
              : t('update.message', '새로운 기능이 추가되었습니다!\n지금 업데이트하시겠습니까?')
            }
          </Text>

          {/* 버튼 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>
                {t('update.updateButton', '업데이트')}
              </Text>
            </TouchableOpacity>

            {!forceUpdate && (
              <TouchableOpacity
                style={[styles.button, styles.laterButton]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.laterButtonText}>
                  {t('update.laterButton', '나중에')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: RFValue(16),
    padding: RFValue(24),
    width: '85%',
    maxWidth: RFValue(400),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: RHValue(16),
  },
  message: {
    fontSize: RFValue(15),
    color: '#333333',
    textAlign: 'center',
    lineHeight: RFValue(22),
    marginBottom: RHValue(20),
  },
  buttonContainer: {
    gap: RHValue(12),
  },
  button: {
    paddingVertical: RHValue(14),
    borderRadius: RFValue(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButton: {
    backgroundColor: '#2F80ED',
  },
  updateButtonText: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  laterButton: {
    backgroundColor: '#F5F5F5',
  },
  laterButtonText: {
    fontSize: RFValue(16),
    fontWeight: '600',
    color: '#666666',
  },
});
