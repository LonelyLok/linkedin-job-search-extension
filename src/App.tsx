import { useState, useEffect } from 'react';
import {
  Typography,
  MenuButton,
  Menu,
  MenuItem,
  Dropdown,
  Box,
  Stack,
  Input,
  Button,
  Switch,
} from '@mui/joy';
import { ArrowDropDown } from '@mui/icons-material';

function App() {
  const [time, setTime] = useState(1);
  const [isHideJobs, setIsHideJobs] = useState(true);

  const [allow, setAllow] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const [unit, setUnit] = useState('days');

  useEffect(() => {
    chrome?.storage?.sync.get(['hideJobs'], (result) => {
      if(result.hideJobs !== undefined) {
        setIsHideJobs(result.hideJobs);
      }
    });
    chrome.tabs?.query({ active: true, currentWindow: true }, function (tabs) {
      const url = tabs[0].url;
      if (url?.startsWith('https://www.linkedin.com/jobs/search')) {
        // Update the f_TPR parameter with a custom value
        setAllow(true);
        setCurrentUrl(url);
      }
    });
  }, []);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(parseInt(e.target.value));
  };

  const convertToSeconds = () => {
    switch (unit) {
      case 'days':
        return time * 24 * 60 * 60;
      case 'weeks':
        return time * 7 * 24 * 60 * 60;
      case 'months':
        return time * 30 * 24 * 60 * 60;
      default:
        return 0;
    }
  };

  const updateUrl = () => {
    if (!currentUrl) return;

    const url = new URL(currentUrl);

    const seconds = convertToSeconds();

    if (!seconds) return;

    url.searchParams.set('f_TPR', `r${seconds}`);

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.update(tabs[0].id!, { url: url.toString() });
    });
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
  };

  const handleHideJobs = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = !!event.target.checked
    setIsHideJobs(checked);
    chrome?.storage?.sync.set({ hideJobs: checked });
    chrome?.tabs?.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0]?.id as number, { action: "toggleHideJobs", hideJobs: checked });
    });
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '20px',
        height: '300px',
        flex: 1, // Added to make the box grow
      }}
    >
      <Typography level='title-lg' textColor='neutral.300'>
        LinkedIn job search extension
      </Typography>
      <Typography level='body-lg' textColor={allow ? '#39FF14' : 'red'}>
        {allow ? 'Allowed' : 'NotAllowed'}
      </Typography>
      {allow && (
        <Box sx={{ marginTop: 2, marginBottom: 2 }}>
          <Typography sx={{level: 'body-md', color: 'white'}}>
            Custom time range
          </Typography>
          <Stack direction='row' spacing={1} alignItems='center' sx={{mt: 1}}>
            <Typography level='body-md' textColor='neutral.300'>
              Last
            </Typography>
            <Input
              size='sm'
              type='number'
              value={time}
              onChange={handleTimeChange}
              sx={{ width: '70px' }}
            />
            <Dropdown>
              <MenuButton
              endDecorator={<ArrowDropDown />}
                sx={{
                  variant: 'outlined',
                  size: 'sm',
                  bgcolor: '#E0E0E0',
                  padding: '2px 8px',
                }}
              >
                {unit}
              </MenuButton>
              <Menu>
                {['days', 'weeks', 'months'].map((timeUnit: string) => {
                  return (
                    <MenuItem key={timeUnit} onClick={() => handleUnitChange(timeUnit)}>
                      {timeUnit}
                    </MenuItem>
                  );
                })}
              </Menu>
            </Dropdown>
          </Stack>
          <Typography sx={{
            level: 'body-md',
            mt: 2,
            color: 'white',
          }}>
            Toggle hidden jobs
          </Typography>
          <Switch sx={{mt: 1}} checked={isHideJobs} onChange={handleHideJobs}></Switch>
        </Box>
      )}
      {allow && (
        <Button
          onClick={updateUrl}
          sx={{
            mt: 'auto',
          }}
        >
          Reload
        </Button>
      )}
    </Box>
  );
}

export default App;
