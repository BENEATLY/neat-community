################################################################################
# Author:     Thomas D'haenens
# License:    GPL-3.0
# Link:       https://github.com/BENEATLY/neat-start-orig/
# Contact:    https://neatly.be/
################################################################################


# IMPORT: Standard Modules
import ftplib                                                                                                                                           # FTP Lib

# IMPORT: Custom Modules
from basic import *                                                                                                                                     # Basic Lib


# FUNCTION: Transfer File via FTP
@log(returnValue=False)
def transferFileViaFTP(src, dst, useTLS=False):

    # One End FTP, One End Local?
    if (not (bool(src.get('hostName')) != bool(dst.get('hostName')))):
        _logger.error('Did not find a local endpoint and an FTP endpoint for file transfer')
        return False

    # Determine FTP & Local Side
    ftpHost = (dst if dst.get('hostName') else src)
    localHost = (src if dst.get('hostName') else dst)

    # Check File Paths
    if ((localHost is src) and ((not localHost.get('directory')) or (not localHost.get('fileName')) or (not ftpHost.get('directory')))):
        _logger.error('Some file path(s) are not fully defined')
        return False
    if ((ftpHost is src) and ((not ftpHost.get('directory')) or (not ftpHost.get('fileName')) or (not localHost.get('directory')))):
        _logger.error('Some file path(s) are not fully defined')
        return False

    # Verify Credentials
    if ((not ftpHost.get('userName')) or (not ftpHost.get('password'))):
        _logger.error('Missing credentials for the FTP endpoint')
        return False

    # Set Up FTP Client
    ftpClient = (ftplib.FTP_TLS() if (useTLS) else ftplib.FTP())
    ftpClient.connect(ftpHost['hostName'], (ftpHost['port'] if ftpHost.get('port') else 21))

    # Attempt Log In
    try:
        _logger.info('Attempting log in on FTP server: ' + ftpHost['hostName'])
        ftpClient.login(ftpHost['userName'], ftpHost['password'])
        _logger.info('Successfully logged in')
    except:
        _logger.error('Log in on FTP server failed')
        return False

    # Start Encryption (for TLS only)
    if (useTLS): ftpClient.prot_p()

    # Send File to FTP
    if (localHost is src):

        # Attempt to Change Remote Folder
        try:
            ftpClient.cwd(ftpHost['directory'])
            _logger.info('Changed remote directory to: ' + ftpHost['directory'])
        except:

            # Create Missing Directory
            if (ftpHost.get('createMissingDir')):

                # Log Message
                _logger.warning('Unable to open remote directory: ' + ftpHost['directory'])
                _logger.info('Attempting to create remote directory: ' + ftpHost['directory'])

                # Path Variables
                fullTempPath = []
                lastCreationState = False

                # Iterate over Path
                for tempPath in (ftpHost['directory'].split('/')):

                    # Add to Full Path
                    fullTempPath.append(tempPath)

                    # Attempt to Create Path
                    if (tempPath):
                        try:
                            ftpClient.mkd('/'.join(fullTempPath))
                            lastCreationState = True
                        except:
                            lastCreationState = False

                # Remote Directory Creation Succeeded
                if (lastCreationState):

                    # Log Message
                    _logger.info('Created remote directory: ' + ftpHost['directory'])

                    # Attempt to Change Remote Folder (Again)
                    try:
                        ftpClient.cwd(ftpHost['directory'])
                        _logger.info('Changed remote directory to: ' + ftpHost['directory'])
                    except:
                        _logger.error('Unable to open remote directory: ' + ftpHost['directory'])
                        ftpClient.close()
                        return False

                # Remote Directory Creation Failed
                else:
                    _logger.error('Unable create remote directory: ' + ftpHost['directory'])
                    ftpClient.close()
                    return False

            # No Create Directory
            else:
                _logger.error('Unable to open remote directory: ' + ftpHost['directory'])
                ftpClient.close()
                return False

        # Create File Path
        filePath = os.path.join(localHost['directory'], localHost['fileName'])

        # Attempt to Open Local File
        try:
            localFile = open(filePath, 'rb')
        except:
            _logger.error('Unable to open local file: ' + filePath)
            ftpClient.close()
            return False

        # Attempt to Transfer Local File
        try:
            remoteFileName = (ftpHost['fileName'] if (ftpHost.get('fileName')) else localHost['fileName'])
            ftpClient.storbinary('STOR ' + remoteFileName, localFile)
            localFile.close()
            ftpClient.close()
            _logger.info('Stored local file ' + filePath + ' on the FTP server (' + os.path.join(ftpHost['directory'], remoteFileName) + ')')
            return True
        except:
            _logger.error('Unable to transfer file: ' + filePath)
            localFile.close()
            ftpClient.close()
            return False

    # Get File from FTP
    else:

        # Attempt to Change Remote Folder
        try:
            ftpClient.cwd(ftpHost['directory'])
            _logger.info('Changed remote directory to: ' + ftpHost['directory'])
        except:
            _logger.error('Unable to open remote directory: ' + ftpHost['directory'])
            ftpClient.close()
            return False

        # Local Directory Exist
        if (not os.path.isdir(localHost['directory'])):

            # Create Missing Directory
            if (localHost.get('createMissingDir')):

                # Log Message
                _logger.warning('Local directory does not exist: ' + localHost['directory'])
                _logger.info('Attempting to create local directory: ' + localHost['directory'])

                # Create Directory Path
                createDirPath(localHost['directory'])

                # Created Directory
                if (os.path.isdir(localHost['directory'])):
                    _logger.info('Created local directory: ' + localHost['directory'])

                # Unable to Create Directory
                else:
                    _logger.error('Local directory does not exist: ' + localHost['directory'])
                    ftpClient.close()
                    return False

            # No Create Directory
            else:
                _logger.error('Local directory does not exist: ' + localHost['directory'])
                ftpClient.close()
                return False

        # Create File Path
        localFileName = (localHost['fileName'] if (localHost.get('fileName')) else ftpHost['fileName'])
        filePath = os.path.join(localHost['directory'], localFileName)

        # Attempt to Store File
        try:
            fileHandler = open(filePath, 'wb')
            ftpClient.retrbinary('RETR ' + ftpHost['fileName'], fileHandler.write)
            fileHandler.close()
            ftpClient.close()
            _logger.info('Stored remote file ' + os.path.join(ftpHost['directory'], ftpHost['fileName']) + ' locally (' + filePath + ')')
            return True
        except:
            _logger.error('Unable to transfer file: ' + os.path.join(ftpHost['directory'], ftpHost['fileName']))
            ftpClient.close()
            return False
