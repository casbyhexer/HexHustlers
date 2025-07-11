import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as MailComposer from 'expo-mail-composer';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const BlueprintScreen = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [uploadedDoc, setUploadedDoc] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const pageNames = ['Plans', 'Rich Version', 'Wealthy Version'];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
  };

  const showPushNotification = async (title: string, body: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: { seconds: 1 },
    });
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(contentOffsetX / width);
    setCurrentPage(pageIndex);
  };

  const navigateToPage = (pageIndex: number) => {
    scrollViewRef.current?.scrollTo({
      x: pageIndex * width,
      animated: true
    });
    setCurrentPage(pageIndex);
  };

  const handleDocumentUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (!result.canceled) {
        setUploadedDoc(result.assets[0]);
        Alert.alert('Success', 'Payment proof uploaded successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  const sendEmailWithAttachment = async () => {
    const emailBody = `NEW RICH BLUEPRINT PURCHASE REQUEST

Customer Details:
━━━━━━━━━━━━━━━━━━━━
👤 Name: ${name}
📧 Email: ${email}
📱 Phone: ${phone}
📄 Document: ${uploadedDoc?.name || 'Attached EFT Proof'}

━━━━━━━━━━━━━━━━━━━━
REQUEST: Please send "Code Your Success: Blueprint" to this customer after verifying payment.

This is an automated email from the Hex Hustlers app.`;

    try {
      const isMailAvailable = await MailComposer.isAvailableAsync();
      if (!isMailAvailable) {
        Alert.alert('Error', 'Email is not available on this device');
        return false;
      }

      const result = await MailComposer.composeAsync({
        recipients: ['cashexerbusiness@gmail.com'],
        subject: '🚀 New Rich Blueprint Purchase - Action Required',
        body: emailBody,
        attachments: uploadedDoc ? [uploadedDoc.uri] : undefined,
      });

      return result.status === MailComposer.MailComposerStatus.SENT;
    } catch (error) {
      console.log('Email Error:', error);
      return false;
    }
  };

  const handleRichSubmit = async () => {
    if (!name || !email || !phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (!uploadedDoc) {
      Alert.alert('Error', 'Please upload proof of payment');
      return;
    }

    setIsSubmitting(true);

    try {
      const emailSent = await sendEmailWithAttachment();
      
      await showPushNotification(
        '🎉 Application Submitted!',
        'Your Rich Blueprint purchase request has been submitted. You will receive your blueprint within 24 hours.'
      );

      Alert.alert(
        'Success!', 
        'Your application has been submitted successfully! We will verify your payment and send you the blueprint within 24 hours.',
        [
          {
            text: 'View Notifications',
            onPress: () => router.push('/notifications'),
          },
          {
            text: 'OK',
            style: 'default',
          }
        ]
      );

      setName('');
      setEmail('');
      setPhone('');
      setUploadedDoc(null);

    } catch (error) {
      console.log('Submit Error:', error);
      Alert.alert('Success', 'Your application has been submitted! We will verify your payment and send you the blueprint within 24 hours.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripePayment = () => {
    Linking.openURL('https://buy.stripe.com/test_aFaeVfew37Fd1va1yR4sE00');
  };

  const handlePayPalPayment = () => {
    Linking.openURL('https://paypal.me/CasHexer');
  };

  const blueprintOptions = [
    {
      title: 'Code Your Success: Rich Version - Complete Developer\'s Blueprint',
      price: 'R525 / $29',
      features: [
        'Complete development guide with code samples',
        'Project planning worksheets',
        'Technology selection framework',
        'Security implementation guide',
        'Real-world code examples',
        'Implementation checklists'
      ],
      description: 'Blueprint will be sent to your email after EFT or PayPal payment verification.',
      buttonText: 'GET RICH VERSION',
      action: () => navigateToPage(1)
    },
    {
      title: 'Code Your Success: Wealthy Version - Premium Membership',
      price: 'R900 / $49 monthly',
      features: [
        'Everything in Rich Version',
        '30-minute monthly consultation call',
        'Additional project templates',
        'Priority email support',
        'Monthly updated content',
        'Exclusive developer resources'
      ],
      description: 'Blueprint sent via email after Stripe/PayPal subscription. Contact details for monthly consultation calls will be provided.',
      buttonText: 'GET WEALTHY VERSION',
      action: () => navigateToPage(2)
    }
  ];

  const renderHeader = () => (
    <View style={styles.header}>
      <Image
        source={require('../../assets/hexhustlersmedia/WhatsApp Image 2025-04-12 at 1.06.19 AM (1).jpeg')}
        style={styles.logo}
        resizeMode="contain"
      />
      <TouchableOpacity onPress={() => router.push('/notifications')}>
        <Ionicons name="notifications" size={28} color="#00f0ff" />
      </TouchableOpacity>
    </View>
  );

  const renderPageIndicator = () => (
    <View style={styles.pageIndicatorContainer}>
      {pageNames.map((name, index) => (
        <TouchableOpacity 
          key={index} 
          onPress={() => navigateToPage(index)}
          style={[
            styles.pageIndicator,
            currentPage === index && styles.pageIndicatorActive
          ]}
        >
          <Text 
            style={[
              styles.pageIndicatorText,
              currentPage === index && styles.pageIndicatorTextActive
            ]}
          >
            {name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPricingPage = () => (
    <View style={styles.pageContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>Developer's Blueprint</Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.pageSubtitle}>Choose your success path</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.pricingScrollContainer}>
        {blueprintOptions.map((option, index) => (
          <Animated.View 
            key={index}
            style={[
              styles.blueprintCard,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20 * (index + 1), 0]
                  })
                }]
              }
            ]}
          >
            <Text style={styles.blueprintTitle}>{option.title}</Text>
            <Text style={styles.blueprintPrice}>{option.price}</Text>
            
            {option.features.map((feature, fIndex) => (
              <Text key={fIndex} style={styles.featureText}>• {feature}</Text>
            ))}
            
            <Text style={styles.descriptionText}>{option.description}</Text>
            
            <TouchableOpacity 
              style={styles.blueprintButton}
              onPress={option.action}
            >
              <Text style={styles.blueprintButtonText}>{option.buttonText}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/services')}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff" style={styles.backIcon} />
          <Text style={styles.backText}>BACK TO SERVICES</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderRichPage = () => (
    <View style={styles.pageContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>RICH BLUEPRINT</Text>
        <Text style={styles.pageSubtitle}>Complete Developer's Guide - R525 / $29</Text>
        <View style={styles.titleUnderline} />
      </View>
      
      <ScrollView contentContainerStyle={styles.formScrollContainer}>
        <View style={styles.formCard}>
          <TextInput
            style={styles.formInput}
            placeholder="Full Name"
            placeholderTextColor="#00f0ff"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.formInput}
            placeholder="Email Address"
            placeholderTextColor="#00f0ff"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.formInput}
            placeholder="Phone Number"
            placeholderTextColor="#00f0ff"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          <View style={styles.bankingSection}>
            <Text style={styles.bankingSectionTitle}>EFT Banking Details</Text>
            <Text style={styles.bankingDetails}>• Bank: Nedbank</Text>
            <Text style={styles.bankingDetails}>• Account Number: 1211596699</Text>
            <Text style={styles.bankingDetails}>• Account Type: Current Account</Text>
            <Text style={styles.bankingDetails}>• Reference: HEX HUSTLERS (Pty) Ltd</Text>
            <Text style={styles.bankingDetails}>• Swift Code: NEDSZAJJ</Text>
          </View>
          
          <View style={styles.uploadSection}>
            <Text style={styles.uploadTitle}>Upload Proof of Payment</Text>
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={handleDocumentUpload}
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#00f0ff" />
              <Text style={styles.uploadText}>
                {uploadedDoc ? 'Document Uploaded' : 'Choose File'}
              </Text>
            </TouchableOpacity>
            {uploadedDoc && (
              <Text style={styles.uploadedFileName}>{uploadedDoc.name}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleRichSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitText}>
              {isSubmitting ? 'SUBMITTING...' : 'EMAIL EFT TO "CASHEXERBUSINESS@GMAIL.COM"'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={handlePayPalPayment}
          >
            <Ionicons name="logo-paypal" size={24} color="#ffffff" />
            <Text style={styles.paymentButtonText}>Pay with PayPal</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.backToPlansButton}
          onPress={() => navigateToPage(0)}
        >
          <Text style={styles.backToPlansText}>BACK TO PLANS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderWealthyPage = () => (
    <View style={styles.pageContainer}>
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>WEALTHY BLUEPRINT</Text>
        <Text style={styles.pageSubtitle}>Premium Membership - R900 / $49 monthly</Text>
        <View style={styles.titleUnderline} />
      </View>
      
      <ScrollView contentContainerStyle={styles.formScrollContainer}>
        <View style={styles.formCard}>
          <TextInput
            style={styles.formInput}
            placeholder="Full Name"
            placeholderTextColor="#00f0ff"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.formInput}
            placeholder="Email Address"
            placeholderTextColor="#00f0ff"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.formInput}
            placeholder="Phone Number"
            placeholderTextColor="#00f0ff"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          <Text style={styles.paymentTitle}>Choose Payment Method</Text>
          
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={handleStripePayment}
          >
            <Ionicons name="card-outline" size={24} color="#ffffff" />
            <Text style={styles.paymentButtonText}>Subscribe with Stripe</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={handlePayPalPayment}
          >
            <Ionicons name="logo-paypal" size={24} color="#ffffff" />
            <Text style={styles.paymentButtonText}>Subscribe with PayPal</Text>
          </TouchableOpacity>

          <Text style={styles.consultationText}>
            Monthly consultation calls available - submit your preferred date each month via contact form.
          </Text>

          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => router.push('/contact')}
          >
            <Ionicons name="mail-outline" size={20} color="#ffffff" />
            <Text style={styles.contactButtonText}>Contact for Consultation Schedule</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.backToPlansButton}
          onPress={() => navigateToPage(0)}
        >
          <Text style={styles.backToPlansText}>BACK TO PLANS</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  return (
    <ImageBackground
      source={require('../../assets/hexhustlersmedia/black_gradient_blue_1_background_by_mannyt1013_deyc41r-fullview.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        {renderHeader()}
        {renderPageIndicator()}
        
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={[styles.page, { width }]}>
            {renderPricingPage()}
          </View>
          
          <View style={[styles.page, { width }]}>
            {renderRichPage()}
          </View>
          
          <View style={[styles.page, { width }]}>
            {renderWealthyPage()}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 5,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  page: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
    padding: 10,
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 5,
    paddingHorizontal: 5,
  },
  pageIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginHorizontal: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pageIndicatorActive: {
    backgroundColor: 'rgba(0,240,255,0.3)',
    borderWidth: 1,
    borderColor: '#00f0ff',
  },
  pageIndicatorText: {
    color: '#ffffff',
    fontSize: 12,
  },
  pageIndicatorTextActive: {
    color: '#00f0ff',
    fontWeight: 'bold',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 5,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00f0ff',
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 5,
    textAlign: 'center',
  },
  titleUnderline: {
    height: 3,
    width: 80,
    borderRadius: 5,
    backgroundColor: '#00f0ff',
    marginTop: 8,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  pricingScrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 5,
  },
  blueprintCard: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  blueprintTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00f0ff',
    marginBottom: 8,
    textAlign: 'center',
  },
  blueprintPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#e0e0e0',
    marginBottom: 5,
    paddingLeft: 5,
  },
  descriptionText: {
    fontSize: 12,
    color: '#00f0ff',
    marginTop: 10,
    marginBottom: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  blueprintButton: {
    backgroundColor: 'rgba(0,240,255,0.2)',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  blueprintButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: 'rgba(0,240,255,0.2)',
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00f0ff',
  },
  backIcon: {
    marginRight: 8,
  },
  backText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  formScrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    paddingHorizontal: 5,
  },
  formCard: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  formInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.5)',
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 15,
  },
  bankingSection: {
    marginVertical: 15,
    padding: 15,
    backgroundColor: 'rgba(0,240,255,0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.3)',
  },
  bankingSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f0ff',
    marginBottom: 10,
    textAlign: 'center',
  },
  bankingDetails: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 5,
    textAlign: 'center',
  },
  uploadSection: {
    marginVertical: 15,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f0ff',
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.5)',
    alignItems: 'center',
    flexDirection: 'row',
  },
  uploadText: {
    color: '#00f0ff',
    marginLeft: 10,
    fontSize: 14,
  },
  uploadedFileName: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: 'rgba(0,240,255,0.2)',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#00f0ff',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(0,240,255,0.1)',
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00f0ff',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  paymentButton: {
    backgroundColor: 'rgba(0,240,255,0.2)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.5)',
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  paymentButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  consultationText: {
    fontSize: 12,
    color: '#00f0ff',
    textAlign: 'center',
    marginVertical: 15,
    fontStyle: 'italic',
  },
  contactButton: {
    backgroundColor: 'rgba(0,240,255,0.15)',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,240,255,0.4)',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  contactButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  backToPlansButton: {
    backgroundColor: 'rgba(0,240,255,0.2)',
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#00f0ff',
  },
  backToPlansText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default BlueprintScreen;