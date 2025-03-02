import classNames from 'classnames';
import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { Toaster } from 'react-hot-toast';
import Nav from '../components/Nav';
import { settings } from '../lib/settings';
import { defaultSettings } from '../../defaultSettings';
import LottieFile from '../../../assets/json/1713988096625.json';
import RestoreModal from '../components/Modal/Restore';
import PortModal from '../components/Modal/Port';
import { settingsHaveChanged } from '../lib/settingsHaveChanged';
import { useStore } from '../store';

export default function Options() {
    const { isConnected, isLoading } = useStore();

    const [theme, setTheme] = useState<undefined | string>();
    const [ipData, setIpData] = useState<undefined | boolean>();
    const [systemTray, setSystemTray] = useState<undefined | boolean>();
    const [showRestoreModal, setShowRestoreModal] = useState(false);
    const [autoSetProxy, setAutoSetProxy] = useState<undefined | boolean>();
    const [shareVPN, setShareVPN] = useState<undefined | boolean>();
    const [port, setPort] = useState();
    const [showPortModal, setShowPortModal] = useState(false);

    useEffect(() => {
        settings.get('theme').then((value) => {
            setTheme(typeof value === 'undefined' ? defaultSettings.theme : value);
        });
        settings.get('ipData').then((value) => {
            setIpData(typeof value === 'undefined' ? defaultSettings.ipData : value);
        });
        settings.get('systemTray').then((value) => {
            setSystemTray(typeof value === 'undefined' ? defaultSettings.systemTray : value);
        });
        settings.get('port').then((value) => {
            setPort(typeof value === 'undefined' ? defaultSettings.port : value);
        });
        settings.get('autoSetProxy').then((value) => {
            setAutoSetProxy(typeof value === 'undefined' ? defaultSettings.autoSetProxy : value);
        });
        settings.get('shareVPN').then((value) => {
            setShareVPN(typeof value === 'undefined' ? defaultSettings.shareVPN : value);
        });
    }, []);

    if (
        typeof theme === 'undefined' ||
        typeof ipData === 'undefined' ||
        typeof port === 'undefined' ||
        typeof autoSetProxy === 'undefined' ||
        typeof shareVPN === 'undefined' ||
        typeof systemTray === 'undefined'
    )
        return (
            <>
                <div className='settings'>
                    <div className='lottie'>
                        <Lottie animationData={LottieFile} loop={true} />
                    </div>
                </div>
            </>
        );

    return (
        <>
            <Nav title='تنظیمات برنامه' />
            <PortModal
                {...{
                    port,
                    setPort
                }}
                title='پورت پروکسی'
                isOpen={showPortModal}
                onClose={() => {
                    setShowPortModal(false);
                    settingsHaveChanged({ ...{ isConnected, isLoading } });
                }}
            />
            <RestoreModal
                {...{
                    setTheme,
                    setIpData,
                    setSystemTray,
                    setPort,
                    setAutoSetProxy,
                    setShareVPN
                }}
                title='بازگردانی تغییرات'
                isOpen={showRestoreModal}
                onClose={() => {
                    setShowRestoreModal(false);
                }}
            />
            <div className={classNames('myApp', 'normalPage')}>
                <div className='settings'>
                    <div
                        className={classNames('item', autoSetProxy ? 'checked' : '')}
                        onClick={() => {
                            setAutoSetProxy(!autoSetProxy);
                            settings.set('autoSetProxy', !autoSetProxy);
                            settingsHaveChanged({ ...{ isConnected, isLoading } });

                            if (autoSetProxy) {
                                setIpData(false);
                                settings.set('ipData', false);
                            }
                        }}
                    >
                        <label className='key'>پیکربندی شبکه</label>
                        <div className='value'>
                            <div className={classNames('checkbox', autoSetProxy ? 'checked' : '')}>
                                <i className='material-icons'>&#xe876;</i>
                            </div>
                        </div>
                        <div className='info'>تنظیم پروکسی بر روی سیستم‌عامل</div>
                    </div>
                    <div
                        className='item'
                        onClick={() => {
                            setShowPortModal(true);
                        }}
                    >
                        <label className='key'>پورت پروکسی</label>
                        <div className='value'>
                            <span className='dirLeft'>{port}</span>
                        </div>
                        <div className='info'>تعیین پورت پروکسی برنامه</div>
                    </div>
                    <div
                        className={classNames('item', shareVPN ? 'checked' : '')}
                        onClick={() => {
                            setShareVPN(!shareVPN);
                            settings.set('hostIP', !shareVPN ? '0.0.0.0' : '127.0.0.1');
                            settings.set('shareVPN', !shareVPN);
                            settingsHaveChanged({ ...{ isConnected, isLoading } });
                        }}
                    >
                        <label className='key'>اتصال از LAN</label>
                        <div className='value'>
                            <div className={classNames('checkbox', shareVPN ? 'checked' : '')}>
                                <i className='material-icons'>&#xe876;</i>
                            </div>
                        </div>
                        <div className='info'>اشتراک‌گذاری پروکسی بر روی شبکه</div>
                    </div>
                    <div
                        className={classNames('item', autoSetProxy ? '' : 'disabled')}
                        onClick={() => {
                            if (autoSetProxy) {
                                setIpData(!ipData);
                                settings.set('ipData', !ipData);
                            }
                        }}
                    >
                        <label className='key'>بررسی IP</label>
                        <div className='value'>
                            <div className={classNames('checkbox', ipData ? 'checked' : '')}>
                                <i className='material-icons'>&#xe876;</i>
                            </div>
                        </div>
                        <div className='info'>نمایش آی‌پی و لوکیشن پس‌از اتصال</div>
                    </div>
                </div>
                <div className='moreSettings'>
                    <i className='material-icons'>&#xe313;</i>
                    سایر تنظیمات
                </div>
                <div className='settings'>
                    <div
                        className='item'
                        onClick={() => {
                            const tmp = theme === 'light' ? 'dark' : 'light';
                            setTheme(tmp);
                            settings.set('theme', tmp);
                            document.documentElement.setAttribute('data-bs-theme', tmp);
                        }}
                    >
                        <label className='key' htmlFor='flexSwitchCheckChecked'>
                            حالت تیره
                        </label>
                        <div className='value'>
                            <div
                                className={classNames(
                                    'checkbox',
                                    theme === 'dark' ? 'checked' : ''
                                )}
                            >
                                <i className='material-icons'>&#xe876;</i>
                            </div>
                        </div>
                        <div className='info' id='flexSwitchCheckChecked'>
                            مشخص‌کردن حالت نمایش برنامه
                        </div>
                    </div>
                    <div
                        className='item'
                        onClick={() => {
                            setSystemTray(!systemTray);
                            settings.set('systemTray', !systemTray);
                        }}
                    >
                        <label className='key'>مخفی‌سازی</label>
                        <div className='value'>
                            <div className={classNames('checkbox', systemTray ? 'checked' : '')}>
                                <i className='material-icons'>&#xe876;</i>
                            </div>
                        </div>
                        <div className='info'>قرار نگرفتن آیکون برنامه در تسک‌بار</div>
                    </div>
                    <div
                        className={'item'}
                        onClick={() => {
                            setShowRestoreModal(true);
                        }}
                    >
                        <label className='key'>بازگردانی</label>
                        <div className='value'>
                            <i className='material-icons'>&#xe8ba;</i>
                        </div>
                        <div className='info'>اعمال تنظیمات پیشفرض برنامه</div>
                    </div>
                </div>
            </div>
            <Toaster position='bottom-center' reverseOrder={false} />
        </>
    );
}
