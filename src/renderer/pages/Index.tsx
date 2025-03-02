import { useEffect, useState } from 'react';
import classNames from 'classnames';
import toast, { Toaster } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import Drawer from 'react-modern-drawer';
import { useStore } from '../store';
import appIco from '../../../assets/oblivion.png';
import defFlag from '../../../assets/img/flags/xx.svg';
import irFlag from '../../../assets/img/flags/ir.svg';
import { settings } from '../lib/settings';
import 'react-modern-drawer/dist/index.css';
import packageJsonData from '../../../package.json';
import { defaultSettings } from '../../defaultSettings';
import { ipcRenderer, checkInternet } from '../lib/utils';

let cachedIpInfo: any = null;
let lastFetchTime = 0;
const cacheDuration = 10 * 1000;
let connectedToIrIPOnceDisplayed = false;
let canCheckNewVer = true;
let hasNewUpdate = false;

export default function Index() {
    const { isConnected, setIsConnected, isLoading, setIsLoading, statusText, setStatusText } =
        useStore();
    const [ipInfo, setIpInfo] = useState<{
        countryCode: string | boolean;
        ip: string;
    }>({
        countryCode: false,
        ip: ''
    });
    const [online, setOnline] = useState(true);

    const [drawerIsOpen, setDrawerIsOpen] = useState(false);
    const toggleDrawer = () => {
        setDrawerIsOpen((prevState) => !prevState);
    };

    const [theme, setTheme] = useState<undefined | string>();
    const [ipData, setIpData] = useState<undefined | boolean>();
    //const [psiphon, setPsiphon] = useState<undefined | boolean>();
    //const [gool, setGool] = useState<undefined | boolean>();
    const [method, setMethod] = useState<undefined | string>('');

    const fetchReleaseVersion = async () => {
        const versionRegex = /\d+(\.\d+)+/;
        try {
            const response = await fetch(
                'https://api.github.com/repos/bepass-org/oblivion-desktop/releases/latest'
            );
            if (response.ok) {
                const data = await response.json();
                const latestVersion = String(data?.tag_name);
                const appVersion = String(packageJsonData?.version);
                if (latestVersion && latestVersion !== appVersion) {
                    hasNewUpdate = true;
                }
            } else {
                console.error('Failed to fetch release version:', response.statusText);
            }
        } catch (error) {
            console.error('Failed to fetch release version:', error);
        }
    };

    useEffect(() => {
        settings.get('theme').then((value) => {
            setTheme(typeof value === 'undefined' ? defaultSettings.theme : value);
        });
        settings.get('ipData').then((value) => {
            setIpData(typeof value === 'undefined' ? defaultSettings.ipData : value);
        });
        /*settings.get('psiphon').then((value) => {
            setPsiphon(typeof value === 'undefined' ? defaultSettings.psiphon : value);
        });
        settings.get('gool').then((value) => {
            setGool(typeof value === 'undefined' ? defaultSettings.gool : value);
        });*/
        settings.get('method').then((value) => {
            setMethod(typeof value === 'undefined' ? defaultSettings.method : value);
        });

        cachedIpInfo = null;
        if (canCheckNewVer) {
            fetchReleaseVersion();
            canCheckNewVer = false;
        }

        ipcRenderer.on('wp-start', (ok) => {
            if (ok) {
                setIsLoading(false);
                setIsConnected(true);
            }
        });

        ipcRenderer.on('wp-end', (ok) => {
            console.log('🚀 - ipcRenderer.once - ok:', ok);
            if (ok) {
                setIsConnected(false);
                setIsLoading(false);
                setIpInfo({
                    countryCode: false,
                    ip: ''
                });
            }
        });

        setOnline(true);
        window.addEventListener('online', () => setOnline(true));
        window.addEventListener('offline', () => setOnline(false));
        return () => {
            window.removeEventListener('online', () => setOnline(true));
            window.removeEventListener('offline', () => setOnline(false));
        };
    }, []);

    useEffect(() => {
        if (online) {
            toast.dismiss('onlineStatus');
        } else {
            checkInternet();
        }
    }, [online]);

    const ipToast = async () => {
        if (connectedToIrIPOnceDisplayed) {
            return false;
        }
        toast(
            (currentToast) => (
                <>
                    <div className='customToast'>
                        <p>
                            کلودفلر به یک IP با لوکیشن ایران که متفاوت از آیپی اصلیته وصلت کرده، که
                            باهاش میتونی فیلترینگ‌رو دور بزنی، اما تحریم‌هارو نه. نگران نباش! در
                            تنظیمات میتونی توسط گزینه «گول» یا «سایفون» لوکیشن رو تغییر بدی.
                        </p>
                        <button onClick={() => toast.dismiss(currentToast?.id)}>متوجه شدم</button>
                    </div>
                </>
            ),
            {
                id: 'ipChangedToIR',
                duration: Infinity,
                style: {
                    borderRadius: '10px',
                    background: theme === 'dark' ? '#535353' : '#242424',
                    color: '#F4F5FB'
                }
            }
        );
        connectedToIrIPOnceDisplayed = true;
    };

    const getIpLocation = async () => {
        try {
            const currentTime = new Date().getTime();
            if (cachedIpInfo && currentTime - lastFetchTime < cacheDuration) {
                setIpInfo(cachedIpInfo);
            } else {
                if (isConnected && !isLoading) {
                    const controller = new AbortController();
                    const signal = controller.signal;
                    const timeoutId = setTimeout(() => {
                        controller.abort();
                        console.log('Fetching aborted due to timeout.');
                    }, 5000);
                    const response = await fetch('https://cloudflare.com/cdn-cgi/trace', {
                        signal
                    });
                    const data = await response.text();
                    const lines = data.split('\n');
                    const ipLine = lines.find((line) => line.startsWith('ip='));
                    const locationLine = lines.find((line) => line.startsWith('loc='));
                    const warpLine = lines.find((warp) => warp.startsWith('warp='));
                    const cfLine = lines.find((warp) => warp.startsWith('h='));
                    const getIp = ipLine ? ipLine.split('=')[1] : '127.0.0.1';
                    const getLoc = locationLine ? locationLine.split('=')[1].toLowerCase() : false;
                    const checkWarp = warpLine ? warpLine.split('=')[1] : '';
                    const cfHost = cfLine ? cfLine.split('=')[1] : 'off';
                    if (getLoc && cfHost === 'cloudflare.com') {
                        if (
                            (method === 'psiphon' && checkWarp !== 'on' && getLoc !== 'ir') ||
                            checkWarp === 'on'
                        ) {
                            const ipInfo2 = {
                                countryCode: getLoc,
                                ip: getIp
                            };
                            cachedIpInfo = ipInfo2;
                            lastFetchTime = currentTime;
                            setIpInfo(ipInfo2);
                        } else {
                            setTimeout(getIpLocation, 7500);
                        }
                    } else {
                        setTimeout(getIpLocation, 7500);
                    }
                    clearTimeout(timeoutId);
                    toast.dismiss('ipLocationStatus');
                }
            }
        } catch (error) {
            /*setIpInfo({
                countryCode: false,
                ip: '127.0.0.1'
            });*/
            setTimeout(getIpLocation, 10000);
            //onChange();
        }
    };

    useEffect(() => {
        if (ipInfo?.countryCode) {
            if (method === '' && ipInfo?.countryCode === 'ir') {
                ipToast();
            } else {
                toast.dismiss('ipChangedToIR');
            }
        }
    }, [ipInfo]);

    useEffect(() => {
        if (ipData) {
            getIpLocation();
        }

        if (isLoading || !isConnected) {
            toast.dismiss('ipChangedToIR');
            toast.dismiss('ipLocationStatus');
        }

        if (isConnected && isLoading) {
            setStatusText('قطع ارتباط ...');
        } else if (!isConnected && isLoading) {
            setStatusText('درحال اتصال ...');
        } else if (isConnected && ipInfo?.countryCode) {
            setStatusText('متصل هستید');
        } else if (isConnected && !ipInfo?.countryCode && ipData) {
            setStatusText('دریافت اطلاعات ...');
        } else if (isConnected && !ipData) {
            setStatusText('اتصال برقرار شد');
        } else {
            setStatusText('متصل نیستید');
        }
    }, [isLoading, isConnected, ipInfo, ipData]);

    const onChange = () => {
        if (!online) {
            checkInternet();
        } else {
            if (isLoading) {
                console.log('🚀 - onChange - isLoading:', isLoading);
                ipcRenderer.sendMessage('wp-end');
            } else if (isConnected) {
                ipcRenderer.sendMessage('wp-end');
                setIsLoading(true);
            } else {
                setIpInfo({
                    countryCode: false,
                    ip: ''
                });
                ipcRenderer.sendMessage('wp-start');
                setIsLoading(true);
            }
        }
    };

    return (
        <>
            <Drawer
                open={drawerIsOpen}
                onClose={toggleDrawer}
                lockBackgroundScroll={false}
                overlayOpacity={1}
                duration={250}
                direction='right'
                className='drawer'
                overlayClassName='drawerOverlay'
                size='80vw'
            >
                <div className='list'>
                    <div className='appName'>
                        <img src={appIco} alt='icon' />
                        <h3>
                            Oblivion <small>Desktop</small>
                        </h3>
                    </div>
                    <ul>
                        <li>
                            <Link to={'/settings'}>
                                <i className={'material-icons'}>&#xe429;</i>
                                <span>تنظیمات وارپ</span>
                            </Link>
                        </li>
                        {/*<li>
                            <Link to={'/routing'}>
                                <i className={'material-icons'}>&#xe90e;</i>
                                <span>قوانین مسیریابی</span>
                            </Link>
                        </li>*/}
                        {/*<li className='divider'></li>*/}
                        <li>
                            <Link to={'/options'}>
                                <i className={'material-icons'}>&#xe8b8;</i>
                                <span>تنظیمات برنامه</span>
                            </Link>
                        </li>
                        <li>
                            <Link to={'/debug'}>
                                <i className={'material-icons'}>&#xe868;</i>
                                <span>لاگ وارپ</span>
                            </Link>
                        </li>
                        <li className={hasNewUpdate ? '' : 'hidden'}>
                            <a
                                href='https://github.com/bepass-org/oblivion-desktop/releases/latest'
                                target='_blank'
                                rel='noreferrer'
                            >
                                <i className={'material-icons'}>&#xe923;</i>
                                <span>بروزرسانی</span>
                                <div className='label label-warning label-xs'>نسخه جدید</div>
                            </a>
                        </li>
                        <li className='divider' />
                        <li>
                            <Link to='/about'>
                                <i className={'material-icons'}>&#xe88e;</i>
                                <span>درباره برنامه</span>
                            </Link>
                        </li>
                    </ul>
                    <div className='appVersion'>
                        v<b>{packageJsonData.version}</b>
                    </div>
                </div>
            </Drawer>
            <nav>
                <div className='container'>
                    {/* TODO use button */}
                    <a onClick={toggleDrawer} className={classNames('navMenu')}>
                        <i className={classNames('material-icons', 'pull-right')}>&#xe5d2;</i>
                        <div
                            className={classNames('indicator', hasNewUpdate ? '' : 'hidden')}
                        ></div>
                    </a>
                    {/*<Link to={'/debug'}>
                        <i className={classNames('material-icons', 'pull-right', 'log')}>
                            &#xe868;
                        </i>
                    </Link>*/}
                    <Link to='/about'>
                        <i className={classNames('material-icons', 'pull-left')}>&#xe88e;</i>
                    </Link>
                </div>
            </nav>
            <div className={classNames('myApp', 'verticalAlign')}>
                <div className='container'>
                    <div className='homeScreen'>
                        <div className='title'>
                            <h1>OBLIVION</h1>
                            <h2>بر پایه وارپ</h2>
                        </div>
                        <form action=''>
                            <div className='connector'>
                                <div
                                    className={classNames(
                                        'switch',
                                        isConnected ? 'active' : '',
                                        isLoading ? 'isLoading' : ''
                                    )}
                                    onClick={onChange}
                                >
                                    <div className='circle'>
                                        <div className='spinner' />
                                    </div>
                                </div>
                            </div>
                        </form>
                        <div
                            className={classNames(
                                'status',
                                isConnected && ipInfo?.countryCode && !isLoading ? 'active' : ''
                            )}
                        >
                            {statusText}
                            <br />
                            <div
                                className={classNames(
                                    'ip',
                                    isConnected && ipInfo?.countryCode && !isLoading
                                        ? 'connected'
                                        : ''
                                )}
                                onClick={() => {
                                    setIpInfo({
                                        countryCode: false,
                                        ip: ''
                                    });
                                    const getTime = new Date().getTime();
                                    if (cachedIpInfo && getTime - lastFetchTime < cacheDuration) {
                                        toast('برای بررسی مجدد چندثانیه دیگر تلاش کنید!', {
                                            id: 'ipLocationStatus',
                                            duration: 2000,
                                            style: {
                                                fontSize: '13px',
                                                borderRadius: '10px',
                                                background: '#333',
                                                color: '#fff'
                                            }
                                        });
                                    } else {
                                        getIpLocation();
                                    }
                                }}
                            >
                                {ipInfo.countryCode ? (
                                    ipInfo?.countryCode === 'ir' ? (
                                        <>
                                            <img src={irFlag} alt='flag' />
                                        </>
                                    ) : (
                                        <>
                                            <ReactCountryFlag
                                                countryCode={String(ipInfo.countryCode)}
                                                svg
                                                style={{
                                                    width: '17px',
                                                    height: '12px'
                                                }}
                                            />
                                        </>
                                    )
                                ) : (
                                    <>
                                        <img src={defFlag} alt='flag' />
                                    </>
                                )}
                                <span>{ipInfo?.ip}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toaster position='bottom-center' reverseOrder={false} />
        </>
    );
}
