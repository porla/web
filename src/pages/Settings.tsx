import { Button } from "@chakra-ui/button";
import { FormControl, FormLabel, FormErrorMessage, FormHelperText } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Heading, HStack } from "@chakra-ui/layout";
import { Field, Form, Formik } from "formik";
import { useInvoker } from "../services/jsonrpc";

const readSingleFile = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const idx = reader.result?.toString().indexOf("base64,")!;
      const data = reader.result?.toString().substring(idx + "base64,".length);
      if (!data) return reject();
      resolve(data);
    };
    reader.onerror = () => reject();
    reader.readAsDataURL(blob);
  });
}

export default function Settings() {
  const webuiInstall = useInvoker("webui.install");

  return (
    <Box>
      <HStack m={3}>
        <Heading as="h3" size="md">Settings</Heading>
      </HStack>

      <Box m={3} w={"md"}>
        <Formik
          initialValues={{
            data: ""
          }}
          onSubmit={async (values) => {
            await webuiInstall({ data: values.data });
            window.location.reload();
          }}
        >
          {({ errors, setFieldValue, isSubmitting, touched }) => (
            <Form>
              <Field name="data">
                {() => (
                  <FormControl isInvalid={touched.data && !!errors.data} mt={3}>
                    <FormLabel>Web UI package file</FormLabel>
                    <Input
                      type="file"
                      onChange={async e => {
                        if (e.currentTarget.files != null) {
                          setFieldValue("data", await readSingleFile(e.currentTarget.files[0]));
                        }
                      }}
                    />
                    {
                      errors.data && touched.data
                        ? <FormErrorMessage>{errors.data}</FormErrorMessage>
                        : <FormHelperText>A zip file containing the web UI to install.</FormHelperText>
                    }
                  </FormControl>
                )}
              </Field>
              <Button
                colorScheme={"purple"}
                disabled={isSubmitting}
                mt={3}
                type="submit"
              >
                Install web UI
              </Button>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  )
}
